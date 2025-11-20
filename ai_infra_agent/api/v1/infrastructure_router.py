from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import Dict, Any, List, Optional

from ai_infra_agent.api.dependencies import get_user_credentials, get_logger, get_agent
from ai_infra_agent.services.discovery.scanner import DiscoveryScanner
from ai_infra_agent.core.supabase_client import get_supabase_client

router = APIRouter()

@router.post("/discover", summary="Trigger discovery of existing AWS resources")
async def discover_resources(
    user_creds: dict = Depends(get_user_credentials),
    logger: Any = Depends(get_logger)
):
    """
    Initiates a scan of the AWS account to discover existing resources
    and saves them to the 'discovered_resources' table.
    """
    logger.info(f"Starting resource discovery for user {user_creds.get('user_id')}")
    
    # Use the agent's scanner, as it's already bound to user credentials
    agent = get_agent(user_creds)
    if not hasattr(agent, 'scanner') or not agent.scanner:
        raise HTTPException(status_code=500, detail="Discovery scanner is not available.")

    try:
        # 1. Scan AWS resources
        discovered_infra_state = await agent.scanner.scan_aws_resources()
        resources_to_upsert = []
        user_id = user_creds.get('user_id')
        aws_region = user_creds.get('aws', {}).get('region', 'us-east-1')

        # 2. Transform scanner output into the database schema
        for resource_type, resources in discovered_infra_state.dict().items():
            if resources: # If there are resources of this type
                for resource_id, resource_data in resources.items():
                    resources_to_upsert.append({
                        "user_id": user_id,
                        "resource_id": resource_id,
                        "resource_type": resource_type, # e.g., 'aws_ec2_instance'
                        "region": aws_region,
                        "properties": resource_data,
                    })

        if not resources_to_upsert:
            logger.info(f"No resources found for user {user_id}. Nothing to save.")
            return {"message": "Discovery finished. No resources found."}

        # 3. Upsert data into the new table
        supabase = get_supabase_client()
        # 'upsert' will insert new resources and update existing ones based on the UNIQUE constraint (user_id, resource_id)
        # We must specify the conflict constraint to use for upserting.
        response = await supabase.from_('discovered_resources').upsert(
            resources_to_upsert, 
            on_conflict='user_id,resource_id'
        ).execute()

        if response.error:
            logger.error(f"Supabase upsert error for user {user_id}: {response.error}")
            raise HTTPException(status_code=500, detail=f"Failed to save discovered resources: {response.error}")
        
        message = f"Discovery successful. Saved or updated {len(resources_to_upsert)} resources."
        logger.info(message)
        return {"message": message}

    except Exception as e:
        logger.error(f"Failed to discover resources for user {user_creds.get('user_id')}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred during discovery: {str(e)}"
        )

@router.get("/", summary="Get discovered infrastructure for the current user")
async def get_discovered_resources(
    user_creds: dict = Depends(get_user_credentials),
    logger: Any = Depends(get_logger),
    region: Optional[str] = Query(None, description="Optional AWS region to filter resources by. Defaults to user's configured region if not provided.")
):
    """
    Retrieves the cached list of discovered resources from the database for the current user,
    optionally filtered by AWS region. If no region is provided, it defaults to the user's
    configured AWS region.
    """
    user_id = user_creds.get('user_id')
    
    # Get user's default AWS region from credentials
    user_default_aws_region = user_creds.get('aws', {}).get('region')
    logger.debug(f"[{user_id}] User default AWS region from credentials: {user_default_aws_region}")
    logger.debug(f"[{user_id}] Region query parameter received: {region}")
    
    # Determine the region to filter by: query parameter takes precedence
    filter_region = region if region else user_default_aws_region
    logger.debug(f"[{user_id}] Final filter region determined: {filter_region}")

    if not filter_region:
        logger.warning(f"[{user_id}] No valid AWS region found. Returning empty list.")
        return [] # Return empty list if no region is configured or provided.

    logger.info(f"[{user_id}] Fetching discovered resources in region {filter_region}")
    
    supabase = get_supabase_client()
    query = supabase.from_('discovered_resources').select("*").eq('user_id', user_id)
    
    logger.debug(f"[{user_id}] Applying region filter: {filter_region}")
    # Using the explicit filter method to ensure region filter is applied.
    query = query.filter('region', 'eq', filter_region)

    # For debugging the final URL
    # This might not work directly as Supabase client builds URL internally.
    # However, it helps ensure the `eq` call is chained.
    logger.debug(f"[{user_id}] Supabase query object after region filter (may not be final URL): {query}")

    response = await query.execute()

    if response.error:
        logger.error(f"[{user_id}] Failed to fetch resources: {response.error}")
        raise HTTPException(status_code=500, detail="Failed to retrieve infrastructure data.")
    
    # Log the number of resources found
    num_resources = len(response.data) if response.data else 0
    logger.debug(f"[{user_id}] Found {num_resources} resources in region {filter_region}")

    return response.data if response.data else []

@router.post("/action", summary="Perform an action on a resource")
async def perform_resource_action(
    user_creds: dict = Depends(get_user_credentials),
    logger: Any = Depends(get_logger),
    action_request: Dict[str, Any] = Body(...) # Example: {"tool_name": "stop_ec2_instance", "parameters": {"instance_id": "i-123"}}
):
    """
    Executes a specific tool on a resource directly, bypassing the AI agent.
    """
    tool_name = action_request.get("tool_name")
    parameters = action_request.get("parameters", {})
    user_id = user_creds.get('user_id')

    if not tool_name or not parameters:
        raise HTTPException(status_code=400, detail="Missing 'tool_name' or 'parameters' in request body.")

    logger.info(f"[{user_id}] is performing action '{tool_name}' with params: {parameters}")
    
    try:
        agent = get_agent(user_creds)
        # Execute tool directly using the agent's tool execution method
        result = await agent.execute_tool(tool_name, **parameters)
        return {"status": "success", "result": result}
    except Exception as e:
        logger.error(f"[{user_id}] Error executing tool '{tool_name}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
