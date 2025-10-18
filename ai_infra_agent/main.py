from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# Import router from the new API structure
from ai_infra_agent.api.v1 import agent_router

# Import the core components that will be injected via dependencies
from ai_infra_agent.api.dependencies import get_agent, get_tool_factory, get_logger
from ai_infra_agent.agent.plan_executor import PlanExecutor

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
async def websocket_execute_plan(websocket: WebSocket):
    """
    Handles the execution of an infrastructure plan over a WebSocket connection.

    This endpoint accepts a JSON plan, then uses the PlanExecutor to execute it
    step-by-step, providing real-time status updates back to the client.
    """
    # Use the dependency injection system to get singleton instances
    agent = get_agent()
    # tool_factory is not directly needed here as PlanExecutor gets it from agent,
    # but we get the logger this way.
    log = get_logger()

    await websocket.accept()
    log.info("WebSocket connection accepted.")
    
    # Initialize the PlanExecutor for this specific connection
    executor = PlanExecutor(agent=agent, websocket=websocket, logger=log)
    
    try:
        # Wait for the client to send the execution plan
        plan_data = await websocket.receive_json()
        log.debug(f"Received plan via WebSocket: {plan_data}")
        
        # Extract the list of steps and start the execution
        execution_plan = plan_data.get("executionPlan")
        if not execution_plan or not isinstance(execution_plan, list):
            raise ValueError("Invalid or missing 'executionPlan' in the received data.")
            
        await executor.execute_plan(execution_plan)

    except WebSocketDisconnect:
        log.warning("WebSocket disconnected by client during execution.")
    except Exception as e:
        log.error(f"An unexpected error occurred in the WebSocket handler: {e}", exc_info=True)
        # The PlanExecutor already sends a detailed error message to the client,
        # so we don't need to send another one here unless we want to.
    finally:
        # Ensure the connection is always closed gracefully
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