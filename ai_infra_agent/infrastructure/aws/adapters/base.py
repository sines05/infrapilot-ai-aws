import boto3
from botocore.config import Config
from loguru import logger
from typing import Dict, Any

class AWSAdapterBase:
    """
    Base class for all AWS service adapters.
    Initializes a boto3 client for a specific AWS service using mandatory,
    user-specific credentials.
    """

    def __init__(self,
                 service_name: str,
                 logger: logger,
                 aws_config: Dict[str, Any]):
        """
        Initializes the AWS adapter.

        Args:
            service_name (str): The name of the AWS service (e.g., 'ec2', 's3').
            logger (Logger): The logger instance.
            aws_config (Dict[str, Any]): A dictionary containing user-specific AWS credentials.
                                         Must include 'access_key_id', 'secret_access_key', and 'region'.
        """
        self.service_name = service_name
        self.logger = logger
        if not aws_config:
            raise ValueError("aws_config is required to initialize an AWS adapter.")
        self.aws_config = aws_config
        self.client = self._create_client()

    def _create_client(self):
        """
        Creates and configures a boto3 client using the provided aws_config.
        This method enforces the use of user-provided credentials and fails if they are incomplete.
        """
        access_key_id = self.aws_config.get("access_key_id")
        secret_access_key = self.aws_config.get("secret_access_key")
        region = self.aws_config.get("region")

        if not all([access_key_id, secret_access_key, region]):
            raise ValueError(
                "Incomplete AWS configuration. 'access_key_id', 'secret_access_key', and 'region' are all required."
            )

        self.logger.info(f"Creating boto3 client for service '{self.service_name}' in region '{region}' using user-provided credentials.")

        try:
            # Configure retries for robustness
            config = Config(
                retries={
                    "max_attempts": self.aws_config.get("max_retries", 3),
                    "mode": "standard",
                }
            )

            client = boto3.client(
                self.service_name,
                region_name=region,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                config=config,
            )
            
            self.logger.info(f"Successfully created boto3 client for '{self.service_name}'.")
            return client
            
        except Exception as e:
            self.logger.error(
                f"Failed to create boto3 client for service '{self.service_name}' with provided credentials: {e}"
            )
            raise