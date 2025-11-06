
import requests
import json

BASE_URL = "http://localhost:8080/api/v1/agent"  # Full API prefix

def test_discover_api():
    """Tests the /discover API endpoint."""
    print("Testing /discover API...")
    try:
        response = requests.post(f"{BASE_URL}/discover")
        response.raise_for_status()  # Raise an exception for HTTP errors
        print("Discovery API Response (Status Code:", response.status_code, "): ")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to the API at {BASE_URL}. Is the server running?")
    except requests.exceptions.RequestException as e:
        print(f"Error testing /discover API: {e}")

def test_state_api():
    """Tests the /state API endpoint."""
    print("\nTesting /state API...")
    try:
        response = requests.get(f"{BASE_URL}/state")
        response.raise_for_status()  # Raise an exception for HTTP errors
        print("State API Response (Status Code:", response.status_code, "): ")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to the API at {BASE_URL}. Is the server running?")
    except requests.exceptions.RequestException as e:
        print(f"Error testing /state API: {e}")

if __name__ == "__main__":
    test_discover_api()
    test_state_api()
