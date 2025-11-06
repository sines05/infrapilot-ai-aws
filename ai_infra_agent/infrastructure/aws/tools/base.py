# ai_infra_agent/infrastructure/aws/tools/base.py
from abc import ABC, abstractmethod
from typing import Dict, Any, TYPE_CHECKING
from loguru import logger

# Sử dụng TYPE_CHECKING để tránh import vòng tròn trong quá trình runtime
# Nó chỉ được sử dụng bởi các công cụ kiểm tra kiểu tĩnh (như mypy, Pylance)
if TYPE_CHECKING:
    from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase


class BaseTool(ABC):
    """Abstract base class for all tools that interact with AWS infrastructure."""

    # Chúng ta thay đổi ec2_adapter thành một adapter chung chung hơn
    def __init__(self, logger: logger, adapter: 'AWSAdapterBase'):
        """
        Initializes the base tool.

        Args:
            logger (Logger): The logger instance.
            adapter (AWSAdapterBase): An instance of an AWS adapter (e.g., EC2Adapter).
        """
        self.logger = logger
        self.adapter = adapter  # Đổi tên thành 'adapter' cho rõ ràng
        self.name = "base_tool"
        self.description = "This is a base tool."

    @abstractmethod
    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool's action. This method must be implemented by subclasses.
        """
        pass