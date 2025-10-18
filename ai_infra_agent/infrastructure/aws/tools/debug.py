# ai_infra_agent/tools/debug_tools.py

from typing import Dict, Any
from .base import BaseTool


class DebugEchoTool(BaseTool):
    """
    A simple tool that echoes back the parameters it receives.
    Useful for debugging the context and variable resolution.
    """
    def __init__(self, logger, adapter):
        super().__init__(logger = logger, adapter = adapter)
        self.name = "debug-echo"
        self.description = "Prints and returns the parameters it was called with."

    def execute(self, **kwargs) -> Dict[str, Any]:
        self.logger.info(f"--- DEBUG ECHO TOOL ---")
        self.logger.info(f"Received parameters: {kwargs}")
        self.logger.info(f"--- END DEBUG ECHO ---")
        return {"received_params": kwargs}