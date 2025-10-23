from typing import Dict, Any, List
from loguru import logger

from ai_infra_agent.core.config import AWSSettings
from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase


class SecurityGroupAdapter(AWSAdapterBase):
    """
    Adapter for managing EC2 security groups.
    """

    def __init__(self, settings: AWSSettings, logger: logger):
        super().__init__("ec2", settings, logger)

    def create_security_group(self, group_name: str, description: str, vpc_id: str) -> Dict[str, Any]:
        """
        Creates a new EC2 security group.
        """
        try:
            response = self.client.create_security_group(
                GroupName=group_name,
                Description=description,
                VpcId=vpc_id
            )
            self.logger.info(f"Security group '{group_name}' created with ID: {response['GroupId']}")
            return response
        except Exception as e:
            self.logger.error(f"Failed to create security group '{group_name}': {e}")
            raise

    def add_security_group_ingress_rule(self, group_id: str, ip_protocol: str, from_port: int, to_port: int, cidr_ip: str) -> Dict[str, Any]:
        """
        Adds an ingress rule to an existing EC2 security group.
        """
        try:
            response = self.client.authorize_security_group_ingress(
                GroupId=group_id,
                IpPermissions=[
                    {
                        'IpProtocol': ip_protocol,
                        'FromPort': from_port,
                        'ToPort': to_port,
                        'IpRanges': [{'CidrIp': cidr_ip}]
                    }
                ]
            )
            self.logger.info(f"Ingress rule added to security group '{group_id}'.")
            return response
        except Exception as e:
            self.logger.error(f"Failed to add ingress rule to security group '{group_id}': {e}")
            raise

    def list_security_groups(self) -> Dict[str, Any]:
        """
        Lists all EC2 security groups.
        """
        try:
            response = self.client.describe_security_groups()
            self.logger.debug(f"Raw describe_security_groups response: {response}")
            self.logger.info(f"Found {len(response.get('SecurityGroups', []))} security groups.")
            return response
        except Exception as e:
            self.logger.error(f"Failed to list security groups: {e}")
            raise