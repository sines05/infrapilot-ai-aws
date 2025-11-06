from typing import Dict, Any, Optional, List
from loguru import logger
import secrets # Import secrets for secure random string generation
import string # Import string for character sets
import re # Import re for regex operations

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
        
        final_bucket_name = bucket_name
        # Use regex to find any placeholder like {random-suffix} or {random_string}
        match = re.search(r"\{.*?\}", bucket_name)
        if match:
            # Generate a random alphanumeric string (e.g., 8 characters long)
            random_suffix = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(8))
            final_bucket_name = bucket_name.replace(match.group(0), random_suffix)
            self.logger.info(f"Resolved bucket name with random string: {final_bucket_name}")

        # Ensure bucket name is lowercase and valid for S3
        final_bucket_name = final_bucket_name.lower().replace("_", "-") # S3 bucket names cannot have underscores

        self.logger.info(f"Attempting to create S3 bucket: {final_bucket_name}")

        # Determine the effective region for bucket creation
        effective_region = region if region else self.adapter.settings.region
        self.logger.info(f"Using effective region for S3 bucket creation: {effective_region}")

        try:
            response = self.adapter.create_bucket(
                bucket_name=final_bucket_name,
                region=effective_region,
                tags=tags
            )
            return {"bucket_name": final_bucket_name, "details": response}
        except Exception as e:
            self.logger.error(f"Failed to create S3 bucket: {e}")
            return {"error": str(e)}
