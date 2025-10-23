from typing import Dict, Any
from logging import Logger
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class CreateKeyPairTool(BaseTool):
    """
    Tool to create a new EC2 key pair.
    """

    def __init__(self, logger, adapter):
        """
        Initializes the CreateKeyPairTool.

        Args:
            logger (Logger): The logger instance.
            adapter (EC2Adapter): The EC2 adapter instance.
        """
        super().__init__(logger=logger, adapter=adapter)
        self.name = "create-key-pair"
        self.description = "Create a new EC2 key pair for SSH access. Returns the private key material which should be saved immediately as it cannot be retrieved later."

    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to create a key pair.

        Args:
            key_name (str): The name of the key pair.

        Returns:
            Dict[str, Any]: The result of the key pair creation.
        """
        key_name = kwargs.get("key_name")
        if not key_name:
            raise ValueError("key_name is a required argument.")

        self.logger.info(f"Executing CreateKeyPairTool with key_name: {key_name}")
        response = self.adapter.create_key_pair(key_name=key_name)
        return {"key_name": response.get("KeyName"), "key_material": response.get("KeyMaterial")}


class ListKeyPairsTool(BaseTool):
    """
    Tool to list existing EC2 key pairs.
    """

    def __init__(self, logger: Logger, adapter: EC2Adapter):
        """
        Initializes the ListKeyPairsTool.

        Args:
            logger (Logger): The logger instance.
            adapter (EC2Adapter): The EC2 adapter instance.
        """
        super().__init__(logger=logger, adapter=adapter)
        self.name = "list-key-pairs"
        self.description = "List all existing EC2 key pairs in the configured region."

    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to list key pairs.

        Returns:
            Dict[str, Any]: A list of key pairs.
        """
        self.logger.info("Executing ListKeyPairsTool")
        return self.adapter.list_key_pairs()