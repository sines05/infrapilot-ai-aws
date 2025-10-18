import boto3
from botocore.config import Config
from loguru import logger

# Import AWSSettings từ vị trí mới trong core/config.py
from ai_infra_agent.core.config import AWSSettings


class AWSAdapterBase:
    """
    Base class for all AWS service adapters.
    Initializes a boto3 client for a specific AWS service.
    """

    def __init__(self, service_name: str, settings: AWSSettings, logger: logger):
        """
        Initializes the AWS adapter.

        Args:
            service_name (str): The name of the AWS service (e.g., 'ec2', 's3').
            settings (AWSSettings): The AWS configuration settings.
            logger (Logger): The logger instance.
        """
        self.service_name = service_name
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
            self.logger.info(
                f"Creating boto3 client for service '{self.service_name}' in region '{self.settings.region}'"
            )
            
            # Configure retries for robustness
            config = Config(
                retries={
                    "max_attempts": self.settings.max_retries,
                    "mode": "standard",
                }
            )

            # Safely extract the actual string values from Pydantic's SecretStr.
            # If the setting is not provided (is None), the value will be None,
            # allowing boto3 to fall back to other credential providers (e.g., IAM roles, ~/.aws/credentials).
            access_key_id = self.settings.access_key_id.get_secret_value() if self.settings.access_key_id else None
            secret_access_key = self.settings.secret_access_key.get_secret_value() if self.settings.secret_access_key else None
            
            # Log whether credentials are being passed directly to boto3.
            # Avoid logging the actual keys.
            if access_key_id:
                self.logger.debug("Using AWS credentials provided via configuration.")
            else:
                self.logger.debug("No AWS credentials provided via configuration. Boto3 will use its default credential chain.")

            client = boto3.client(
                self.service_name,
                region_name=self.settings.region,
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