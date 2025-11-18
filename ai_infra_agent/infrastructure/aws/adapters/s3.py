from typing import Dict, Any, Optional, List
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase
from ai_infra_agent.core.config import AWSSettings


class S3Adapter(AWSAdapterBase):
    """
    Adapter for interacting with the AWS S3 service.
    """

    def __init__(self, settings: AWSSettings, logger: logger):
        """
        Initializes the S3 adapter.

        Args:
            settings (AWSSettings): The AWS configuration settings.
            logger (Logger): The logger instance.
        """
        super().__init__(service_name="s3", logger=logger, aws_config=None, settings=settings)

    def create_bucket(self, bucket_name: str, region: Optional[str] = None, tags: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Creates a new S3 bucket.

        Args:
            bucket_name (str): The name of the S3 bucket.
            region (Optional[str]): The region to create the bucket in. If None, uses the adapter's default region.
            tags (Optional[List[Dict[str, str]]]): Tags to apply to the bucket.

        Returns:
            Dict[str, Any]: The response from the create_bucket call.
        """
        self.logger.info(f"Creating S3 bucket: {bucket_name} in region: {region or self.settings.region}")
        try:
            create_bucket_configuration = {}
            if region and region != 'us-east-1': # us-east-1 does not require LocationConstraint
                create_bucket_configuration['LocationConstraint'] = region

            params = {'Bucket': bucket_name}
            if create_bucket_configuration:
                params['CreateBucketConfiguration'] = create_bucket_configuration

            response = self.client.create_bucket(**params)
            
            # Add tags if provided
            if tags:
                self.client.put_bucket_tagging(
                    Bucket=bucket_name,
                    Tagging={'TagSet': tags}
                )

            self.logger.info(f"S3 bucket '{bucket_name}' created successfully.")
            return response
        except Exception as e:
            self.logger.error(f"Error creating S3 bucket '{bucket_name}': {e}")
            raise
