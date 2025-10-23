from typing import Dict, Any, List, Optional
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class CreateEC2InstanceTool(BaseTool):
    """
    Tool to create an EC2 instance.
    """
    def __init__(self, logger, adapter):
        super().__init__(logger = logger, adapter = adapter)
        self.name = "create-ec2-instance"
        self.description = "Creates a new EC2 instance."

    def execute(
        self,
        image_id: str = None,
        instance_type: str = None,
        key_name: str = None,
        min_count: int = 1,
        max_count: int = 1,
        tags: List[Dict[str, str]] = None,
        security_group_ids: Optional[List[str]] = None,
        subnet_id: Optional[str] = None,
        **kwargs # Accept additional kwargs to handle LLM inconsistencies
    ) -> Dict[str, Any]:
        """
        Executes the tool to create an EC2 instance.

        Args:
            image_id (str): The ID of the AMI.
            instance_type (str): The instance type (e.g., 't2.micro').
            key_name (str): The name of the key pair.
            min_count (int): The minimum number of instances to launch.
            max_count (int): The maximum number of instances to launch.
            tags (List[Dict[str, str]], optional): A list of tags to apply. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the create_instance call.
        """
        self.logger.info(f"Executing tool: {self.name}")

        # Handle LLM inconsistency: if image_id is not provided, check for imageId
        final_image_id = image_id
        if not final_image_id and "imageId" in kwargs:
            final_image_id = kwargs["imageId"]
        
        if not final_image_id:
            raise ValueError("image_id (or imageId) is a required argument.")

        return self.adapter.create_instance(
            image_id=final_image_id,
            instance_type=instance_type,
            key_name=key_name,
            min_count=min_count,
            max_count=max_count,
            tags=tags,
            security_group_ids=security_group_ids,
            subnet_id=subnet_id,
        )


class ListEC2InstancesTool(BaseTool):
    """
    Tool to list EC2 instances.
    """
    def __init__(self, logger, adapter):
        super().__init__(logger, adapter)
        self.name = "list-ec2-instances"
        self.description = "Lists existing EC2 instances."

    def execute(self, instance_ids: List[str] = None) -> Dict[str, Any]:
        """
        Executes the tool to list EC2 instances.

        Args:
            instance_ids (List[str], optional): A list of instance IDs to filter by. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the list_instances call.
        """
        self.logger.info(f"Executing tool: {self.name}")
        return self.adapter.list_instances(instance_ids=instance_ids)


class TerminateEC2InstanceTool(BaseTool):
    """
    Tool to terminate an EC2 instance.
    """
    def __init__(self, logger, adapter):
        super().__init__(logger, adapter)
        self.name = "terminate-ec2-instance"
        self.description = "Terminates a specific EC2 instance."

    def execute(self, instance_ids: List[str]) -> Dict[str, Any]:
        """
        Executes the tool to terminate EC2 instances.

        Args:
            instance_ids (List[str]): A list of instance IDs to terminate.

        Returns:
            Dict[str, Any]: The response from the terminate_instance call.
        """
        self.logger.info(f"Executing tool: {self.name}")
        return self.adapter.terminate_instance(instance_ids=instance_ids)
