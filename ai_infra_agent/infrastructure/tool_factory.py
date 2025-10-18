from typing import Dict, Type
from logging import Logger
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool
# Import tool classes here once they are created
from ai_infra_agent.infrastructure.aws.tools.ec2 import (
    CreateEC2InstanceTool,
    ListEC2InstancesTool,
    TerminateEC2InstanceTool,
)
from ai_infra_agent.infrastructure.aws.tools.ami import GetLatestAmazonLinuxAMITool
from ai_infra_agent.infrastructure.aws.tools.keypair import CreateKeyPairTool, ListKeyPairsTool


class ToolFactory:
    """
    Factory class to create and manage tools.
    """

    def __init__(self, logger: Logger):
        """
        Initializes the ToolFactory.

        Args:
            logger (Logger): The logger instance.
        """
        self.logger = logger
        self._tools: Dict[str, BaseTool] = {}
        self.logger.info("ToolFactory initialized.")

    def register_tool(self, name: str, tool: BaseTool):
        """Registers a tool instance."""
        self.logger.info(f"Registering tool: {name}")
        self._tools[name] = tool

    def get_tool_names(self) -> list[str]:
        """Returns a list of registered tool names."""
        return list(self._tools.keys())

    def create_tool(self, tool_name: str) -> BaseTool:
        """
        Retrieves a registered tool instance.

        Args:
            tool_name (str): The name of the tool to retrieve.

        Returns:
            BaseTool: An instance of the requested tool.

        Raises:
            ValueError: If the tool_name is not a registered tool.
        """
        self.logger.debug(f"Attempting to create tool: {tool_name}")
        tool = self._tools.get(tool_name)
        if not tool:
            self.logger.error(f"Tool '{tool_name}' not found.")
            raise ValueError(f"Tool '{tool_name}' not found.")
        return tool

