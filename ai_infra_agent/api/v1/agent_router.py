from fastapi import APIRouter, Body, Depends, HTTPException
from typing import Any, Dict, List
from datetime import datetime

from ai_infra_agent.agent.agent import StateAwareAgent
from ai_infra_agent.api.dependencies import get_agent, get_logger, get_user_credentials, get_scanner
from ai_infra_agent.services.discovery.scanner import DiscoveryScanner
from ai_infra_agent.core.supabase_client import get_supabase_client

# Create a new router instance. This will be included in the main FastAPI app.
router = APIRouter()

def convert_datetimes_to_iso_string(obj: Any) -> Any:
    """Recursively converts datetime objects in a dict or list to ISO 8601 strings."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: convert_datetimes_to_iso_string(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_datetimes_to_iso_string(i) for i in obj]
    return obj


@router.post(
    "/process",
    summary="Process a user request and return an execution plan",
    response_description="A JSON object representing the execution plan.",
)
async def process_request(
    request_body: Dict[str, Any] = Body(
        ...,
        example={"request": "create a t3.micro ec2 instance"},
    ),
    user_creds: dict = Depends(get_user_credentials),
):
    """
    Receives a user request in natural language, processes it through the AI Agent,
    and returns a proposed execution plan.
    """
    user_request = request_body.get("request")
    if not user_request:
        raise HTTPException(
            status_code=400,
            detail={"error": "Field 'request' is required in the request body."},
        )

    try:
        agent = get_agent(user_creds)
        plan = await agent.process_request(user_request)
        if "error" in plan:
            raise HTTPException(status_code=500, detail=plan)
        return plan
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        log = get_logger()
        log.error(f"Failed to process request: {e}", exc_info=True)
        print("--- FULL SERVER TRACEBACK ---")
        traceback.print_exc()
        print("-----------------------------")
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post(
    "/discover",
    summary="Trigger discovery of existing AWS resources",
    response_description="A confirmation message of the discovery.",
)
async def discover_resources(
    user_creds: dict = Depends(get_user_credentials),
    logger: Any = Depends(get_logger),
    scanner: DiscoveryScanner = Depends(get_scanner), # Inject the user-specific scanner
):
    """
    Initiates a scan of the user's AWS account to discover existing resources.
    This endpoint creates temporary, user-specific components to perform the scan correctly.
    """
    user_id = user_creds.get("user_id")
    logger.info(f"[DISCOVER] Starting user-specific discovery for user {user_id}")
    try:
        aws_creds = user_creds.get("aws", {})
        if not aws_creds or not aws_creds.get("access_key_id"):
            raise HTTPException(status_code=400, detail="AWS credentials are not configured for this user.")

        # 1. Scan resources using the injected user-specific scanner
        logger.info(f"Scanner configured. Starting scan for user {user_id}.")
        discovered_infra_state = await scanner.scan_aws_resources()
        logger.info(f"Discovery complete for user {user_id}. Found {len(discovered_infra_state.resources)} total resources.")

        # 2. Transform and collect resources for DB
        resources_to_upsert = []
        aws_region = aws_creds.get("region") # Get region directly from user_creds
        
        if not aws_region:
             raise HTTPException(status_code=400, detail="AWS region is not configured for this user. Please update your settings.")

        for resource in discovered_infra_state.resources.values():
            resources_to_upsert.append({
                "user_id": user_id,
                "resource_id": resource.id,
                "resource_type": resource.type,
                "region": aws_region,
                "properties": convert_datetimes_to_iso_string(resource.properties),
            })
        
        if not resources_to_upsert:
            return {"message": "Discovery finished. No AWS resources found."}

        # 3. Upsert data into the database
        logger.info(f"Saving {len(resources_to_upsert)} resources to the database...")
        supabase = get_supabase_client()
        response = supabase.from_("discovered_resources").upsert(
            resources_to_upsert, on_conflict="user_id,resource_id"
        ).execute()

        message = f"Discovery successful. Saved or updated {len(resources_to_upsert)} resources."
        logger.info(message)
        return {"message": message}

    except HTTPException:
        raise # Re-raise HTTPExceptions
    except Exception as e:
        logger.error(f"Failed to discover resources for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred during discovery: {str(e)}"
        )


@router.get(
    "/resources",
    summary="Get all discovered resources for the current user",
    response_description="A list of discovered resources.",
)
async def get_resources(
    user_creds: dict = Depends(get_user_credentials),
    logger: Any = Depends(get_logger),
):
    """
    Retrieves the cached list of discovered resources from the 'discovered_resources'
    table for the currently authenticated user.
    """
    user_id = user_creds.get("user_id")
    logger.info(f"Fetching discovered resources for user {user_id}")
    
    try:
        supabase = get_supabase_client()
        response = supabase.from_("discovered_resources").select("*").eq("user_id", user_id).execute()
        
        # The data is in the .data attribute of the response
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Failed to fetch resources for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve infrastructure data.")
