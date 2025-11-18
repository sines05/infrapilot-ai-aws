from typing import Dict, Any
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class GetLatestAmazonLinuxAMITool(BaseTool):
    """
    Tool to find the latest Amazon Linux AMI.
    """

    def __init__(self, logger, adapter):
        """
        Initializes the GetLatestAmazonLinuxAMITool.
        """
        super().__init__(logger = logger, adapter = adapter)
        self.name = "get-latest-amazon-linux-ami"
        self.description = "Find the latest Amazon Linux 2 AMI ID to use for launching EC2 instances."

    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to get the latest Amazon Linux 2023 AMI.
        """
        self.logger.info("Getting latest Amazon Linux 2023 AMI...")
        try:
            # Sửa các tham số này để tìm AMI mới nhất
            # Sử dụng owner 'amazon' và name pattern cho Amazon Linux 2023
            ami_info = self.adapter.get_latest_ami(
                owner="amazon",
                name_pattern="al2023-ami-*-x86_64"
            )
            self.logger.info(f"Found latest Amazon Linux 2023 AMI: {ami_info['ImageId']}")
            return {
                "ami_id": ami_info.get("ImageId"),
                "description": ami_info.get("Description"),
                "name": ami_info.get("Name"),
            }
        except Exception as e:
            self.logger.error(f"Failed to get latest Amazon Linux 2023 AMI: {e}")
            return {"error": str(e)}

class GetLatestUbuntuAmiTool(BaseTool):
    """
    Tool to find the latest Ubuntu AMI.
    """

    def __init__(self, logger, adapter):
        """
        Initializes the GetLatestUbuntuAmiTool.
        """
        super().__init__(logger=logger, adapter=adapter)
        self.name = "get-latest-ubuntu-ami"
        self.description = "Find the latest Ubuntu AMI ID to use for launching EC2 instances."

    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to get the latest Ubuntu AMI.
        """
        self.logger.info("Getting latest Ubuntu AMI...")
        try:
            # Ubuntu AMIs are typically owned by '099720109477' (Canonical)
            # The name pattern usually includes the release version and 'hvm-ssd'
            ami_info = self.adapter.get_latest_ubuntu_ami()
            self.logger.info(f"Found latest Ubuntu AMI: {ami_info['ImageId']}")
            return {
                "ami_id": ami_info.get("ImageId"),
                "description": ami_info.get("Description"),
                "name": ami_info.get("Name"),
            }
        except Exception as e:
            self.logger.error(f"Failed to get latest Ubuntu AMI: {e}")
            return {"error": str(e)}