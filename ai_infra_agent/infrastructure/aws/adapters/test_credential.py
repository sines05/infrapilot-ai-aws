import boto3
from botocore.exceptions import NoCredentialsError, ClientError

def test_aws_authentication():
    try:
        # Tạo client STS (Security Token Service)
        sts_client = boto3.client("sts")

        # Gọi API để lấy thông tin người dùng hiện tại
        response = sts_client.get_caller_identity()

        # In ra thông tin xác minh
        print("✅ Xác minh thành công!")
        print(f"👤 Username (ARN): {response['Arn']}")
        print(f"🧾 Account ID: {response['Account']}")
        print(f"🪪 User ID: {response['UserId']}")

    except NoCredentialsError:
        print("❌ Không tìm thấy thông tin xác thực AWS. Vui lòng kiểm tra AWS credentials hoặc cấu hình môi trường.")
    except ClientError as e:
        print(f"❌ Lỗi khi xác thực AWS: {e}")
    except Exception as e:
        print(f"⚠️ Lỗi không xác định: {e}")

if __name__ == "__main__":
    test_aws_authentication()
