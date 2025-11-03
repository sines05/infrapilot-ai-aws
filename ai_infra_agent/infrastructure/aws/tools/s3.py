from typing import Dict, Any, Optional, List
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.s3 import S3Adapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class CreateS3BucketTool(BaseTool):
    """
    Tool to create a new S3 bucket.
    """

    def __init__(self, logger: logger, adapter: S3Adapter):
        """
        Initializes the CreateS3BucketTool.
        """
        super().__init__(logger, adapter)
        self.name = "create-s3-bucket"
        self.description = "Creates a new S3 bucket in a specified region."

    def execute(
        self,
        bucket_name: str,
        region: Optional[str] = None,
        tags: Optional[List[Dict[str, str]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes the tool to create an S3 bucket.

        Args:
            bucket_name (str): The name of the S3 bucket.
            region (Optional[str]): The region to create the bucket in. If None, uses the adapter's default region.
            tags (Optional[List[Dict[str, str]]]): Tags to apply to the bucket.

        Returns:
            Dict[str, Any]: A dictionary containing the details of the created bucket.
        """
        self.logger.info(f"Executing CreateS3BucketTool for bucket: {bucket_name}")
        try:
            response = self.adapter.create_bucket(
                bucket_name=bucket_name,
                region=region,
                tags=tags
            )
            return {"bucket_name": bucket_name, "details": response}
        except Exception as e:
            self.logger.error(f"Failed to create S3 bucket: {e}")
            return {"error": str(e)}
