from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# Import router from the new API structure
from ai_infra_agent.api.v1 import agent_router

# Import the core components that will be injected via dependencies
from ai_infra_agent.api.dependencies import get_agent, get_tool_factory, get_logger, get_user_credentials
from ai_infra_agent.agent.plan_executor import PlanExecutor
from ai_infra_agent.core.supabase_client import verify_user_token, get_user_aws_credentials, get_user_google_credentials
from fastapi import Query

# --- FastAPI App Initialization ---
app = FastAPI(
    title="AI Infrastructure Agent",
    description="An agent to manage AWS infrastructure using natural language, now with a new modular architecture.",
    version="2.0.0",
)

# --- CORS Middleware Configuration ---
# This allows the frontend (running on a different port/domain) to communicate with the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000", "http://127.0.0.1:3000"], # Allow all for dev, adjust for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Endpoint for Plan Execution ---
@app.websocket("/ws/v1/agent/execute")
async def websocket_execute_plan(websocket: WebSocket, token: str = Query(None), user_id: str = Query(None, alias="user_id")):
    """
    Handles the execution of an infrastructure plan over a WebSocket connection.

    This endpoint accepts a JSON plan, then uses the PlanExecutor to execute it
    step-by-step, providing real-time status updates back to the client.
    
    Authentication: Accepts either a Supabase JWT token or user_id as query parameter.
    """
    log = get_logger()
    await websocket.accept()
    
    # Try to verify token first
    user_id_from_token = None
    user_email = ""
    
    if token:
        try:
            user = verify_user_token(token)
            user_id_from_token = user["user_id"]
            user_email = user.get("email", "")
            log.info(f"WebSocket authenticated via token for user {user_id_from_token}")
        except Exception as e:
            log.warning(f"Token verification failed: {e}, trying user_id parameter")
    
    # Fallback to user_id parameter if token verification failed
    if not user_id_from_token:
        if user_id:
            user_id_from_token = user_id
            log.info(f"WebSocket authenticated via user_id parameter: {user_id}")
            # Try to fetch email from database
            try:
                from ai_infra_agent.core.supabase_client import get_supabase_client
                supabase = get_supabase_client()
                resp = supabase.table("users").select("email").eq("id", user_id).maybe_single().execute()
                data = getattr(resp, "data", None) or (resp and resp.get("data"))
                user_email = data.get("email") if data else ""
            except Exception as e:
                log.warning(f"Failed to fetch user email: {e}")
        else:
            await websocket.send_json({"status": "error", "message": "Missing token or user_id query parameter"})
            await websocket.close(code=1008)
            return

    # Fetch user credentials
    try:
        aws_creds = get_user_aws_credentials(user_id_from_token)
        google_creds = get_user_google_credentials(user_id_from_token)
        user_creds = {"user_id": user_id_from_token, "email": user_email, "aws": aws_creds, "google": google_creds}
    except Exception as e:
        log.error(f"Credential fetch failed for user {user_id_from_token}: {e}", exc_info=True)
        await websocket.send_json({"status": "error", "message": f"Unable to fetch user credentials: {str(e)}"})
        await websocket.close()
        return

    # Create a per-connection agent bound to this user's credentials
    agent = get_agent(user_creds)
    executor = PlanExecutor(agent=agent, websocket=websocket, logger=log)

    log.info(f"WebSocket connection accepted for user {user_id}")

    try:
        plan_data = await websocket.receive_json()
        log.debug(f"Received plan via WebSocket: {plan_data}")
        execution_plan = plan_data.get("executionPlan")
        if not execution_plan or not isinstance(execution_plan, list):
            await websocket.send_json({"status": "error", "message": "Invalid or missing 'executionPlan'"})
            return
        await executor.execute_plan(execution_plan)
    except WebSocketDisconnect:
        log.warning("WebSocket disconnected by client during execution.")
    except Exception as e:
        log.error(f"An unexpected error occurred in the WebSocket handler: {e}", exc_info=True)
        await websocket.send_json({"status": "error", "message": str(e)})
    finally:
        await websocket.close()
        log.info("WebSocket connection closed.")
    

# --- HTTP API Router ---
# Include the REST endpoints from the agent_router.
# All routes in agent_router will be prefixed with /api/v1/agent.
app.include_router(
    agent_router.router,
    prefix="/api/v1/agent",
    tags=["Agent API"],
)

# --- Root Endpoint ---
@app.get("/", summary="Root endpoint", tags=["General"])
async def read_root():
    """
    A simple endpoint to confirm that the API server is running.
    """
    return {"message": "Welcome to the AI Infrastructure Agent API"}

# --- Static Files and Frontend ---
# This part can be enabled when you have a frontend build ready.
# from fastapi.staticfiles import StaticFiles
# from pathlib import Path
#
# web_build_dir = Path(__file__).parent.parent / "web" / "build"
# if web_build_dir.exists():
#     app.mount("/", StaticFiles(directory=web_build_dir, html=True), name="static")
#     logger.info(f"Serving static frontend from: {web_build_dir}")
# else:
#     logger.warning(f"Frontend build directory not found at {web_build_dir}. UI will not be served.")