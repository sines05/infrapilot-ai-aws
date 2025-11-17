import asyncio
import websockets
import json
import requests

async def test_execution():
    # Step 1: Get the hardcoded plan from the API
    print("Step 1: Fetching execution plan from API...")
    try:
        response = requests.post(
            "http://127.0.0.1:8080/api/v1/agent/process",
            json={"request": "create ec2 instance"}
        )
        response.raise_for_status()
        plan = response.json()
        print("Plan fetched successfully.")
        # print("Plan:", json.dumps(plan, indent=2))
    except requests.exceptions.RequestException as e:
        print(f"Error fetching plan: {e}")
        return

    # Step 2: Send the plan to the WebSocket for execution
    uri = "ws://127.0.0.1:8080/ws/v1/agent/execute"
    print(f"\nStep 2: Connecting to WebSocket at {uri} and sending plan...")
    try:
        # Add a valid Origin header to bypass CORS checks
        headers = {"Origin": "http://localhost:8080"}
        async with websockets.connect(uri, extra_headers=headers) as websocket:
            # Send the plan
            await websocket.send(json.dumps(plan))
            print("Plan sent. Waiting for execution updates...")

            # Listen for messages from the server
            while True:
                try:
                    message = await websocket.recv()
                    update = json.loads(message)
                    print("\n[SERVER UPDATE]")
                    print(json.dumps(update, indent=2))
                    if update.get("status") == "Execution Completed Successfully":
                        break
                except websockets.ConnectionClosed:
                    print("\nConnection closed by server.")
                    break
    except Exception as e:
        print(f"An error occurred with the WebSocket: {e}")

if __name__ == "__main__":
    asyncio.run(test_execution())