import requests
import websocket
import json
import threading
import time

# --- Cấu hình ---
API_BASE_URL = "http://127.0.0.1:8000/api/v1/agent"
WEBSOCKET_URL = "ws://127.0.0.1:8000/ws/v1/agent/execute"

# Yêu cầu ngôn ngữ tự nhiên bạn muốn gửi đến agent
USER_REQUEST = "create an ec2 instance" #create a t3.micro ec2 instance in ap-southeast-1 with SSH access

# --- Hàm lấy kế hoạch từ API ---
def get_execution_plan(request_text: str) -> dict:
    """
    Gửi yêu cầu ngôn ngữ tự nhiên đến API để nhận kế hoạch thực thi.
    """
    process_url = f"{API_BASE_URL}/process"
    headers = {"Content-Type": "application/json"}
    payload = {"request": request_text}

    print(f"\n--- Bước 1: Gửi yêu cầu đến API để tạo kế hoạch ---")
    print(f"URL: {process_url}")
    print(f"Yêu cầu: '{request_text}'")

    try:
        response = requests.post(process_url, headers=headers, json=payload)
        response.raise_for_status()  # Ném lỗi cho các mã trạng thái HTTP xấu (4xx hoặc 5xx)
        plan = response.json()
        print(f"Kế hoạch nhận được:\n{json.dumps(plan, indent=2)}")
        return plan
    except requests.exceptions.RequestException as e:
        print(f"Lỗi khi gọi API /process: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Phản hồi lỗi từ server: {e.response.text}")
        return {}

# --- Hàm thực thi kế hoạch qua WebSocket ---
def execute_plan_via_websocket(execution_plan: dict):
    """
    Kết nối WebSocket và gửi kế hoạch để thực thi.
    """
    print(f"\n--- Bước 2: Kết nối WebSocket và thực thi kế hoạch ---")
    print(f"URL WebSocket: {WEBSOCKET_URL}")

    def on_message(ws, message):
        print(f"Nhận từ WebSocket: {message}")

    def on_error(ws, error):
        print(f"Lỗi WebSocket: {error}")

    def on_close(ws, close_status_code, close_msg):
        print(f"Kết nối WebSocket đóng: {close_status_code} - {close_msg}")

    def on_open(ws):
        print("Kết nối WebSocket đã mở. Đang gửi kế hoạch...")
        try:
            ws.send(json.dumps(execution_plan))
            print("Kế hoạch đã gửi.")
        except Exception as e:
            print(f"Lỗi khi gửi kế hoạch qua WebSocket: {e}")

    # Tạo một đối tượng WebSocket
    ws = websocket.WebSocketApp(
        WEBSOCKET_URL,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )

    # Chạy WebSocket trong một luồng riêng để không chặn luồng chính
    # ws.run_forever() sẽ chặn, nên dùng threading
    wst = threading.Thread(target=ws.run_forever, daemon=True)
    wst.start()

    # Đợi một chút để kết nối và gửi tin nhắn
    time.sleep(5) 

    # Giữ luồng chính hoạt động để WebSocket có thể nhận tin nhắn
    # Bạn có thể thêm logic để đóng kết nối sau khi nhận được một tin nhắn cụ thể
    # hoặc sau một khoảng thời gian nhất định.
    # Ví dụ: đợi 30 giây rồi đóng
    print("Đang chờ phản hồi từ WebSocket (tối đa 30 giây)...")
    time.sleep(30) 
    
    # The 'connected' attribute is not directly available on WebSocketApp.
    # We rely on the daemon thread to exit with the main program.
    # Optionally, attempt to close the connection.
    print("Kết thúc chờ phản hồi WebSocket. Đang đóng kết nối (nếu còn mở).")
    ws.close()


# --- Luồng thực thi chính ---
if __name__ == "__main__":
    # 1. Lấy kế hoạch thực thi
    plan_response = get_execution_plan(USER_REQUEST)

    if plan_response and "executionPlan" in plan_response:
        execution_plan = plan_response
        # 2. Thực thi kế hoạch qua WebSocket
        execute_plan_via_websocket(execution_plan)
    else:
        print("\nKhông thể lấy kế hoạch thực thi. Vui lòng kiểm tra log server và cấu hình.")