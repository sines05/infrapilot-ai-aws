import requests
import json
import asyncio
import websockets

# --- Cấu hình ---
API_BASE_URL = "http://127.0.0.1:8000/api/v1/agent"
WEBSOCKET_URL = "ws://127.0.0.1:8000/ws/v1/agent/execute"

# Yêu cầu ngôn ngữ tự nhiên bạn muốn gửi đến agent
USER_REQUEST = "Tạo một môi trường web hoàn chỉnh: Đầu tiên, tạo một VPC mới. Sau đó, tạo một key pair tên là 'test-key-04'. Tiếp theo, tạo một security group tên 'web-sg' cho phép truy cập SSH và HTTP. Sử dụng AMI Ubuntu mới nhất để tạo một EC2 instance trong VPC đó với key pair vừa tạo. Cuối cùng, tạo một S3 bucket có tên ngẫu nhiên và duy nhất để lưu trữ logs."

# --- Hàm lấy kế hoạch từ API (giữ nguyên, không cần thay đổi) ---
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
        response.raise_for_status()
        plan = response.json()
        print(f"Kế hoạch nhận được:\n{json.dumps(plan, indent=2)}")
        return plan
    except requests.exceptions.RequestException as e:
        print(f"Lỗi khi gọi API /process: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Phản hồi lỗi từ server: {e.response.text}")
        return {}

# --- Hàm thực thi kế hoạch qua WebSocket (ĐÃ VIẾT LẠI) ---
async def execute_plan_via_websocket(execution_plan: dict):
    """
    Kết nối WebSocket và gửi kế hoạch để thực thi bằng asyncio và websockets.
    """
    print(f"\n--- Bước 2: Kết nối WebSocket và thực thi kế hoạch ---")
    print(f"URL WebSocket: {WEBSOCKET_URL}")

    try:
        # Sử dụng async with để tự động quản lý kết nối
        async with websockets.connect(WEBSOCKET_URL) as ws:
            print("Kết nối WebSocket đã mở. Đang gửi kế hoạch...")
            
            # Gửi kế hoạch đến server
            await ws.send(json.dumps(execution_plan))
            print("Kế hoạch đã gửi.")

            # Lắng nghe tất cả các tin nhắn từ server cho đến khi server đóng kết nối
            print("\n--- Bắt đầu nhận phản hồi từ WebSocket ---")
            async for message in ws:
                print(f"<-- Nhận từ server: {message}")
            
            print("--- Server đã đóng kết nối ---")

    except websockets.exceptions.ConnectionClosed as e:
        print(f"Kết nối WebSocket đã đóng với lỗi: {e}")
    except Exception as e:
        print(f"Đã xảy ra lỗi không mong muốn với WebSocket: {e}")

# --- Luồng thực thi chính (ĐÃ VIẾT LẠI SỬ DỤNG ASYNCIO) ---
async def main():
    """
    Hàm async chính để điều phối việc lấy và thực thi kế hoạch.
    """
    # 1. Lấy kế hoạch thực thi (hàm này là đồng bộ, không cần await)
    plan_response = get_execution_plan(USER_REQUEST)

    if plan_response and "executionPlan" in plan_response:
        # 2. Thực thi kế hoạch qua WebSocket
        await execute_plan_via_websocket(plan_response)
    else:
        print("\nKhông thể lấy kế hoạch thực thi. Vui lòng kiểm tra log server và cấu hình.")

if __name__ == "__main__":
    # Chạy hàm main bất đồng bộ bằng asyncio
    asyncio.run(main())
