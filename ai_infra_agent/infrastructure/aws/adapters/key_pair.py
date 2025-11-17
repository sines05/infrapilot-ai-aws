from typing import Dict, Any
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase
from ai_infra_agent.core.config import AWSSettings


class KeyPairAdapter(AWSAdapterBase):
    """
    Adapter for interacting with AWS EC2 Key Pairs.
    """

    def __init__(self, logger: logger, aws_config: dict = None, settings: AWSSettings = None):
        """
        Initializes the KeyPair adapter. Note that Key Pair resources are managed via the 'ec2' client.

        Args:
            settings (AWSSettings): The AWS configuration settings.
            logger (Logger): The logger instance.
        """
        super().__init__(service_name="ec2", logger=logger, aws_config=aws_config, settings=settings)

    def create_key_pair(self, key_name: str) -> Dict[str, Any]:
        """
        Creates a new EC2 key pair.

        Args:
            key_name (str): The name for the new key pair.

        Returns:
            Dict[str, Any]: The response from the create_key_pair call.
        """
        self.logger.info(f"Creating key pair: {key_name}")
        try:
            return self.client.create_key_pair(KeyName=key_name)
        except Exception as e:
            self.logger.error(f"Error creating key pair '{key_name}': {e}")
            raise

    def list_key_pairs(self) -> Dict[str, Any]:
        """
        Lists all EC2 key pairs.

        Returns:
            Dict[str, Any]: The response from the describe_key_pairs call.
        """
        self.logger.info("Listing all key pairs")
        try:
            return self.client.describe_key_pairs()
        except Exception as e:
            self.logger.error(f"Error listing key pairs: {e}")
            raise
