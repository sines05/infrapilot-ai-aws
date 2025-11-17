import boto3 #AWS SDK Library for Python
from botocore.config import Config #Allows detailed configuration of boto3 client behavior
from loguru import logger

# Import AWSSettings từ vị trí mới trong core/config.py
from typing import Optional, Dict, Any


class AWSAdapterBase:
    """
    Base class for all AWS service adapters.
    Initializes a boto3 client for a specific AWS service.
    """

    def __init__(self,
                 service_name: str,
                 logger: logger,
                 aws_config: Optional[Dict[str, Any]] = None,
                 settings=None):
        """
        Initializes the AWS adapter.

        Args:
            service_name (str): The name of the AWS service (e.g., 'ec2', 's3').
            settings (AWSSettings): The AWS configuration settings.
            logger (Logger): The logger instance.
        """
        self.service_name = service_name
        # aws_config is a dict with keys: access_key_id, secret_access_key, region, max_retries (optional)
        self.aws_config = aws_config or {}
        self.settings = settings
        self.logger = logger
        self.client = self._create_client()

    def _create_client(self):
        """
        Creates and configures a boto3 client.
        This method safely extracts secret values from Pydantic's SecretStr
        before passing them to the boto3 client.
        """
        try:
            region = None
            max_retries = None

            if self.aws_config:
                region = self.aws_config.get("region")
                max_retries = self.aws_config.get("max_retries")
            # fallback to settings if provided
            if not region and self.settings:
                try:
                    region = getattr(self.settings, "region", None)
                except Exception:
                    region = None
            if not max_retries and self.settings:
                try:
                    max_retries = getattr(self.settings, "max_retries", None)
                except Exception:
                    max_retries = None

            self.logger.info(f"Creating boto3 client for service '{self.service_name}' in region '{region or 'default'}'")
            
            # Configure retries for robustness
            config = Config(
                retries={
                    "max_attempts": max_retries or 3,
                    "mode": "standard",
                }
            )

            # Safely extract the actual string values from Pydantic's SecretStr.
            # If the setting is not provided (is None), the value will be None,
            # allowing boto3 to fall back to other credential providers (e.g., IAM roles, ~/.aws/credentials).
            access_key_id = None
            secret_access_key = None
            if self.aws_config:
                access_key_id = self.aws_config.get("access_key_id")
                secret_access_key = self.aws_config.get("secret_access_key")
            # if settings provided and keys are Pydantic SecretStr
            if not access_key_id and self.settings:
                try:
                    access_key_id = self.settings.access_key_id.get_secret_value() if self.settings.access_key_id else None
                except Exception:
                    access_key_id = getattr(self.settings, "access_key_id", None)
            if not secret_access_key and self.settings:
                try:
                    secret_access_key = self.settings.secret_access_key.get_secret_value() if self.settings.secret_access_key else None
                except Exception:
                    secret_access_key = getattr(self.settings, "secret_access_key", None)
            
            # Log whether credentials are being passed directly to boto3.
            # Avoid logging the actual keys.
            if access_key_id:
                self.logger.debug("Using AWS credentials provided via configuration.")
            else:
                self.logger.debug("No AWS credentials provided via configuration. Boto3 will use its default credential chain.")

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
            # Catching a broad exception here is acceptable as boto3 can raise various errors.
            self.logger.error(
                f"Failed to create boto3 client for service '{self.service_name}': {e}"
            )
            # Re-raise the exception to be handled by the calling code.
            raise