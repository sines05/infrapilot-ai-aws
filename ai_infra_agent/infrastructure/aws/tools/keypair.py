from typing import Dict, Any
from loguru import logger

# Import the new KeyPairAdapter
from ai_infra_agent.infrastructure.aws.adapters.key_pair import KeyPairAdapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class CreateKeyPairTool(BaseTool):
    """
    Tool to create a new EC2 key pair.
    """

    # Expect a KeyPairAdapter
    def __init__(self, logger: logger, adapter: KeyPairAdapter):
        """
        Initializes the CreateKeyPairTool.
        """
        super().__init__(logger=logger, adapter=adapter)
        self.name = "create-key-pair"
        self.description = "Create a new EC2 key pair for SSH access. Returns the private key material which should be saved immediately as it cannot be retrieved later."

    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to create a key pair.
        """
        key_name = kwargs.get("key_name")
        if not key_name:
            raise ValueError("key_name is a required argument.")

        self.logger.info(f"Executing CreateKeyPairTool with key_name: {key_name}")
        # This now calls the method on KeyPairAdapter
        response = self.adapter.create_key_pair(key_name=key_name)
        return {"key_name": response.get("KeyName"), "key_material": response.get("KeyMaterial")}


class ListKeyPairsTool(BaseTool):
    """
    Tool to list existing EC2 key pairs.
    """

    # Expect a KeyPairAdapter
    def __init__(self, logger: logger, adapter: KeyPairAdapter):
        """
        Initializes the ListKeyPairsTool.
        """
        super().__init__(logger=logger, adapter=adapter)
        self.name = "list-key-pairs"
        self.description = "List all existing EC2 key pairs in the configured region."

    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to list key pairs.
        """
        self.logger.info("Executing ListKeyPairsTool")
        # This now calls the method on KeyPairAdapter
        return self.adapter.list_key_pairs()
