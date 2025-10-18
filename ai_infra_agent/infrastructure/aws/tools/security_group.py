from typing import Dict, Any, List
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class CreateSecurityGroupTool(BaseTool):
    """
    Tool to create a new EC2 security group.
    """

    def __init__(self, logger, adapter):
        """
        Initializes the CreateSecurityGroupTool.
        """
        super().__init__(logger=logger, adapter=adapter)
        self.name = "create-security-group"
        self.description = "Creates a new EC2 security group in a specified VPC."

    def execute(self, group_name: str, description: str, vpc_id: str, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to create a security group.

        Args:
            group_name (str): The name of the security group.
            description (str): A description for the security group.
            vpc_id (str): The ID of the VPC to create the security group in.

        Returns:
            Dict[str, Any]: The response from the create_security_group call.
        """
        self.logger.info(f"Creating security group '{group_name}' in VPC '{vpc_id}'...")
        try:
            response = self.adapter.client.create_security_group(
                GroupName=group_name,
                Description=description,
                VpcId=vpc_id
            )
            group_id = response['GroupId']
            self.logger.info(f"Security group '{group_name}' created with ID: {group_id}")
            return {"groupId": group_id, "groupName": group_name}
        except Exception as e:
            self.logger.error(f"Failed to create security group '{group_name}': {e}")
            return {"error": str(e)}


class AddSecurityGroupIngressRuleTool(BaseTool):
    """
    Tool to add an ingress rule to an existing EC2 security group.
    """

    def __init__(self, logger: logger, adapter: EC2Adapter):
        """
        Initializes the AddSecurityGroupIngressRuleTool.
        """
        super().__init__(logger, adapter)
        self.name = "add-security-group-ingress-rule"
        self.description = "Adds an ingress rule to an existing EC2 security group."

    def execute(self, group_id: str, protocol: str, from_port: int, to_port: int, cidr_block: str, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to add an ingress rule.

        Args:
            group_id (str): The ID of the security group.
            protocol (str): The IP protocol name (e.g., 'tcp', 'udp', 'icmp').
            from_port (int): The start of the port range for the TCP and UDP protocols.
            to_port (int): The end of the port range for the TCP and UDP protocols.
            cidr_block (str): The CIDR IP range.

        Returns:
            Dict[str, Any]: The response from the authorize_security_group_ingress call.
        """
        self.logger.info(f"Adding ingress rule to security group '{group_id}' for {protocol}:{from_port}-{to_port} from {cidr_block}...")
        try:
            response = self.adapter.client.authorize_security_group_ingress(
                GroupId=group_id,
                IpPermissions=[
                    {
                        'IpProtocol': protocol,
                        'FromPort': from_port,
                        'ToPort': to_port,
                        'IpRanges': [{'CidrIp': cidr_block}]
                    }
                ]
            )
            self.logger.info(f"Ingress rule added to security group '{group_id}'.")
            return {"success": True, "response": response}
        except Exception as e:
            self.logger.error(f"Failed to add ingress rule to security group '{group_id}': {e}")
            return {"error": str(e)}
