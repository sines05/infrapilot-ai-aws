from typing import List, Dict, Any, Optional
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase


class EC2Adapter(AWSAdapterBase):
    """
    Adapter for interacting with the AWS EC2 service.
    """

    def __init__(self, logger: logger, aws_config: Dict[str, Any]):
        """
        Initializes the EC2 adapter.

        Args:
            logger (Logger): The logger instance.
            aws_config (Dict[str, Any]): User-specific AWS credentials.
        """
        super().__init__(service_name="ec2", logger=logger, aws_config=aws_config)

    def list_instances(self, instance_ids: List[str] = None) -> Dict[str, Any]:
        """
        Lists EC2 instances.

        Args:
            instance_ids (List[str], optional): A list of instance IDs to filter by. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the describe_instances call.
        """
        self.logger.info(f"Listing EC2 instances with IDs: {instance_ids}")
        try:
            if instance_ids:
                return self.client.describe_instances(InstanceIds=instance_ids)
            else:
                return self.client.describe_instances()
        except Exception as e:
            self.logger.error(f"Error listing EC2 instances: {e}")
            raise

    def create_instance(
        self,
        image_id: str,
        instance_type: str,
        key_name: str,
        min_count: int = 1,
        max_count: int = 1,
        tags: Optional[List[Dict[str, str]]] = None,
        security_group_ids: Optional[List[str]] = None,
        subnet_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates a new EC2 instance.

        Args:
            image_id (str): The ID of the AMI.
            instance_type (str): The instance type (e.g., 't2.micro').
            key_name (str): The name of the key pair.
            min_count (int): The minimum number of instances to launch.
            max_count (int): The maximum number of instances to launch.
            tags (List[Dict[str, str]], optional): A list of tags to apply. Defaults to None.
            security_group_ids (List[str], optional): A list of security group IDs. Defaults to None.
            subnet_id (str, optional): The ID of the subnet to launch the instance in. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the run_instances call.
        """
        self.logger.info(f"Creating EC2 instance with image '{image_id}' and type '{instance_type}'")
        try:
            run_params = {
                'ImageId': image_id,
                'InstanceType': instance_type,
                'KeyName': key_name,
                'MinCount': min_count,
                'MaxCount': max_count,
            }

            if subnet_id:
                run_params['SubnetId'] = subnet_id
            
            if security_group_ids:
                run_params['SecurityGroupIds'] = security_group_ids

            if tags:
                run_params['TagSpecifications'] = [
                    {"ResourceType": "instance", "Tags": tags},
                    {"ResourceType": "volume", "Tags": tags}
                ]

            return self.client.run_instances(**run_params)

        except Exception as e:
            self.logger.error(f"Error creating EC2 instance: {e}")
            raise


    def terminate_instance(self, instance_ids: List[str]) -> Dict[str, Any]:
        """
        Terminates one or more EC2 instances.

        Args:
            instance_ids (List[str]): A list of instance IDs to terminate.

        Returns:
            Dict[str, Any]: The response from the terminate_instances call.
        """
        self.logger.info(f"Terminating EC2 instances: {instance_ids}")
        try:
            return self.client.terminate_instances(InstanceIds=instance_ids)
        except Exception as e:
            self.logger.error(f"Error terminating EC2 instances '{instance_ids}': {e}")
            raise

    def get_latest_ami(self, owner: str, name_pattern: str) -> Dict[str, Any]:
        """
        Gets the latest AMI based on owner and name pattern.

        Args:
            owner (str): The owner of the AMI (e.g., 'amazon').
            name_pattern (str): The pattern to match the AMI name (e.g., 'al2023-ami-*-x86_64').

        Returns:
            Dict[str, Any]: The dictionary of the latest image found.
        """
        self.logger.info(f"Searching for latest AMI with owner '{owner}' and pattern: {name_pattern}")
        try:
            response = self.client.describe_images(
                Owners=[owner],
                Filters=[
                    {"Name": "name", "Values": [name_pattern]},
                    {"Name": "state", "Values": ["available"]},
                    {"Name": "architecture", "Values": ["x86_64"]}
                ],
            )
            images = sorted(response["Images"], key=lambda x: x["CreationDate"], reverse=True)
            if not images:
                raise ValueError(f"No matching AMI found for owner '{owner}' and pattern '{name_pattern}'")
            return images[0]
        except Exception as e:
            self.logger.error(f"Error getting latest AMI: {e}")
            raise

    def get_latest_ubuntu_ami(self) -> Dict[str, Any]:
        """
        Gets the latest Ubuntu Server 22.04 LTS (HVM), SSD Volume Type AMI for x86_64 architecture.
        Owner ID for Canonical (Ubuntu) is '099720109477'.
        """
        self.logger.info("Searching for latest Ubuntu Server 22.04 LTS AMI...")
        try:
            # Canonical (Ubuntu) owner ID
            ubuntu_owner_id = "099720109477"
            # Pattern for Ubuntu Server 22.04 LTS, HVM, SSD Volume Type, x86_64
            # The name pattern often includes the build date, e.g., "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20230126"
            ubuntu_name_pattern = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"

            response = self.client.describe_images(
                Owners=[ubuntu_owner_id],
                Filters=[
                    {"Name": "name", "Values": [ubuntu_name_pattern]},
                    {"Name": "state", "Values": ["available"]},
                    {"Name": "architecture", "Values": ["x86_64"]},
                    {"Name": "virtualization-type", "Values": ["hvm"]},
                    {"Name": "root-device-type", "Values": ["ebs"]}
                ],
            )
            images = sorted(response["Images"], key=lambda x: x["CreationDate"], reverse=True)
            if not images:
                raise ValueError(f"No matching Ubuntu AMI found for pattern '{ubuntu_name_pattern}'")
            return images[0]
        except Exception as e:
            self.logger.error(f"Error getting latest Ubuntu AMI: {e}")
            raise

    def start_instance(self, instance_id: str) -> Dict[str, Any]:
        """
        Starts an EC2 instance.

        Args:
            instance_id (str): The ID of the instance to start.

        Returns:
            Dict[str, Any]: The response from the start_instances call.
        """
        self.logger.info(f"Starting EC2 instance: {instance_id}")
        try:
            return self.client.start_instances(InstanceIds=[instance_id])
        except Exception as e:
            self.logger.error(f"Error starting EC2 instance '{instance_id}': {e}")
            raise

    def stop_instance(self, instance_ids: List[str]) -> Dict[str, Any]:
        """
        Stops one or more EC2 instances.

        Args:
            instance_ids (List[str]): A list of instance IDs to stop.

        Returns:
            Dict[str, Any]: The response from the stop_instances call.
        """
        self.logger.info(f"Stopping EC2 instances: {instance_ids}")
        try:
            return self.client.stop_instances(InstanceIds=instance_ids)
        except Exception as e:
            self.logger.error(f"Error stopping EC2 instances '{instance_ids}': {e}")
            raise

    def create_volume(self, availability_zone: str, size: int, volume_type: str = 'gp3', tags: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Creates a new EBS volume.

        Args:
            availability_zone (str): The AZ to create the volume in.
            size (int): The size of the volume in GiB.
            volume_type (str, optional): The volume type (e.g., 'gp3', 'io2'). Defaults to 'gp3'.
            tags (Optional[List[Dict[str, str]]], optional): Tags to apply. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the create_volume call.
        """
        self.logger.info(f"Creating new {size}GiB EBS volume of type '{volume_type}' in {availability_zone}.")
        try:
            params = {
                'AvailabilityZone': availability_zone,
                'Size': size,
                'VolumeType': volume_type
            }
            if tags:
                params['TagSpecifications'] = [{'ResourceType': 'volume', 'Tags': tags}]
            
            response = self.client.create_volume(**params)
            self.logger.info(f"Volume created: {response.get('VolumeId')}")
            return response
        except Exception as e:
            self.logger.error(f"Error creating volume: {e}")
            raise

    def list_availability_zones(self) -> Dict[str, Any]:
        """
        Describes all available Availability Zones.

        Returns:
            Dict[str, Any]: The response from the describe_availability_zones call.
        """
        self.logger.info("Listing all Availability Zones.")
        try:
            return self.client.describe_availability_zones()
        except Exception as e:
            self.logger.error(f"Error listing Availability Zones: {e}")
            raise