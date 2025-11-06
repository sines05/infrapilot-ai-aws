from typing import Dict, Any, List, Optional
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool
from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter


class CreateEC2InstanceTool(BaseTool):
    """
    Tool to create an EC2 instance.
    """
    def __init__(self, logger, adapter: EC2Adapter):
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
    def __init__(self, logger, adapter: EC2Adapter):
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
    def __init__(self, logger, adapter: EC2Adapter):
        super().__init__(logger, adapter)
        self.name = "terminate-ec2-instance"
        self.description = "Terminates a specific EC2 instance."

    def execute(self, instance_id: Optional[str] = None, instance_ids: Optional[List[str]] = None, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to terminate EC2 instances.
        Accepts either a single instance_id or a list of instance_ids.

        Args:
            instance_id (Optional[str]): A single instance ID to terminate.
            instance_ids (Optional[List[str]]): A list of instance IDs to terminate.

        Returns:
            Dict[str, Any]: The response from the terminate_instance call.
        """
        final_instance_ids = []
        if instance_ids:
            final_instance_ids.extend(instance_ids)
        if instance_id:
            final_instance_ids.append(instance_id)
        
        if not final_instance_ids:
            raise ValueError("Either 'instance_id' or 'instance_ids' must be provided.")

        self.logger.info(f"Executing tool: {self.name} for instances: {final_instance_ids}")
        return self.adapter.terminate_instance(instance_ids=final_instance_ids)

class StartInstanceTool(BaseTool):
    """
    Tool to start a stopped EC2 instance.
    """

    def __init__(self, logger, adapter: EC2Adapter):
        """
        Initializes the StartInstanceTool.
        """
        super().__init__(logger, adapter)
        self.name = "start-instance"
        self.description = "Starts a specified EC2 instance."

    def execute(self, instance_id: str, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to start an instance.

        Args:
            instance_id (str): The ID of the EC2 instance to start.

        Returns:
            Dict[str, Any]: The response from the start_instances call.
        """
        self.logger.info(f"Executing StartInstanceTool for instance: {instance_id}")
        try:
            response = self.adapter.start_instance(instance_id=instance_id)
            return response
        except Exception as e:
            self.logger.error(f"Failed to start instance {instance_id}: {e}")
            return {"error": str(e)}

class StopInstanceTool(BaseTool):
    """
    Tool to stop a running EC2 instance.
    """

    def __init__(self, logger, adapter: EC2Adapter):
        """
        Initializes the StopInstanceTool.
        """
        super().__init__(logger, adapter)
        self.name = "stop-instance"
        self.description = "Stops a specified EC2 instance."

    def execute(self, instance_id: str, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to stop an instance.

        Args:
            instance_id (str): The ID of the EC2 instance to stop.

        Returns:
            Dict[str, Any]: The response from the stop_instances call.
        """
        self.logger.info(f"Executing StopInstanceTool for instance: {instance_id}")
        try:
            response = self.adapter.stop_instance(instance_id=instance_id)
            return response
        except Exception as e:
            self.logger.error(f"Failed to stop instance {instance_id}: {e}")
            return {"error": str(e)}

class CreateVolumeTool(BaseTool):
    """
    Tool to create a new EBS volume.
    """

    def __init__(self, logger, adapter: EC2Adapter):
        """
        Initializes the CreateVolumeTool.
        """
        super().__init__(logger, adapter)
        self.name = "create-volume"
        self.description = "Creates a new EBS volume in a specified Availability Zone."

    def execute(self, availability_zone: str, size: int, volume_type: str = 'gp3', tags: Optional[List[Dict[str, str]]] = None, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to create a volume.

        Args:
            availability_zone (str): The Availability Zone to create the volume in.
            size (int): The size of the volume in GiB.
            volume_type (str, optional): The type of the volume. Defaults to 'gp3'.
            tags (Optional[List[Dict[str, str]]], optional): Tags to apply to the volume. Defaults to None.

        Returns:
            Dict[str, Any]: A dictionary containing the details of the created volume.
        """
        self.logger.info(f"Executing CreateVolumeTool in AZ: {availability_zone} with size: {size}GiB")
        try:
            response = self.adapter.create_volume(
                availability_zone=availability_zone,
                size=size,
                volume_type=volume_type,
                tags=tags
            )
            return response
        except Exception as e:
            self.logger.error(f"Failed to create volume: {e}")
            return {"error": str(e)}

class ListAvailabilityZonesTool(BaseTool):
    """
    Tool to list all available Availability Zones.
    """
    def __init__(self, logger, adapter: EC2Adapter):
        super().__init__(logger, adapter)
        self.name = "list-availability-zones"
        self.description = "Lists all available AWS Availability Zones in the current region."

    def execute(self) -> Dict[str, Any]:
        """
        Executes the tool to list Availability Zones.

        Returns:
            Dict[str, Any]: A dictionary containing a list of Availability Zone names.
        """
        self.logger.info(f"Executing tool: {self.name}")
        try:
            response = self.adapter.list_availability_zones()
            az_names = [az['ZoneName'] for az in response.get('AvailabilityZones', [])]
            return {"availability_zones": az_names}
        except Exception as e:
            self.logger.error(f"Failed to list Availability Zones: {e}")
            return {"error": str(e)}
