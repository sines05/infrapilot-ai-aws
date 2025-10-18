from fastapi import APIRouter, Body, Depends, HTTPException
from typing import Any, Dict

from ai_infra_agent.agent.agent import StateAwareAgent
from ai_infra_agent.state.manager import StateManager
from ai_infra_agent.api.dependencies import get_agent, get_state_manager

# Create a new router instance. This will be included in the main FastAPI app.
router = APIRouter()


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
    agent: StateAwareAgent = Depends(get_agent),
):
    """
    Receives a user request in natural language, processes it through the AI Agent,
    and returns a proposed execution plan.

    The agent analyzes the current infrastructure state and the user's request
    to generate a series of tool calls that can fulfill the request.
    """
    user_request = request_body.get("request")
    if not user_request:
        raise HTTPException(
            status_code=400,
            detail={"error": "Field 'request' is required in the request body."},
        )

    try:
        plan = await agent.process_request(user_request)
        if "error" in plan:
            # If the plan itself contains an error (e.g., JSON parsing failed)
            raise HTTPException(status_code=500, detail=plan)
        return plan
    except Exception as e:
        # Catch unexpected errors during agent processing
        agent.logger.error(f"Failed to process request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get(
    "/state",
    summary="Get the current infrastructure state",
    response_description="The current state of managed infrastructure as a JSON object.",
)
async def get_state(state_manager: StateManager = Depends(get_state_manager)):
    """
    Retrieves and returns the current state of the managed infrastructure
    from the StateManager.

    The state is typically stored in a local file and represents the agent's
    knowledge of the cloud resources it manages.
    """
    try:
        # The state object is already loaded in the StateManager instance.
        # We just need to convert it to a dictionary for the JSON response.
        current_state = state_manager.state
        return current_state.dict()
    except Exception as e:
        state_manager.logger.error(f"Failed to get state: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve infrastructure state: {str(e)}"
        )


# Note: The /agent/execute endpoint is now handled entirely by the WebSocket
# in main.py. An HTTP endpoint for execution is no longer necessary in this
# architecture as it cannot provide real-time feedback. If you need a way
# to trigger non-interactive executions, you could add a POST endpoint here
# that starts the execution in the background, but the WebSocket approach is
# superior for interactive use cases.