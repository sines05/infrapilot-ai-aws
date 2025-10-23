from typing import Dict, Any, List
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.security_group import SecurityGroupAdapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class CreateSecurityGroupTool(BaseTool):
    """
    Tool to create a new EC2 security group.
    """

    def __init__(self, logger, adapter: SecurityGroupAdapter):
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
            response = self.adapter.create_security_group(
                group_name=group_name,
                description=description,
                vpc_id=vpc_id
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

    def __init__(self, logger: logger, adapter: SecurityGroupAdapter):
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
            response = self.adapter.add_security_group_ingress_rule(
                group_id=group_id,
                ip_protocol=protocol,
                from_port=from_port,
                to_port=to_port,
                cidr_ip=cidr_block
            )
            self.logger.info(f"Ingress rule added to security group '{group_id}'.")
            return {"success": True, "response": response}
        except Exception as e:
            self.logger.error(f"Failed to add ingress rule to security group '{group_id}': {e}")
            return {"error": str(e)}


class ListSecurityGroupsTool(BaseTool):
    """
    Tool to list all EC2 security groups, optionally filtered by a list of group IDs.
    """

    def __init__(self, logger: logger, adapter: SecurityGroupAdapter):
        """
        Initializes the ListSecurityGroupsTool.
        """
        super().__init__(logger, adapter)
        self.name = "list-security-groups"
        self.description = "Lists all EC2 security groups, optionally filtered by a list of group IDs."

    def execute(self, vpc_id: str = None, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to list security groups.

        Args:
            vpc_id (str, optional): The ID of the VPC to filter security groups by. Defaults to None.

        Returns:
            Dict[str, Any]: A dictionary containing the list of security groups or an error message.
        """
        self.logger.info("Listing security groups...")
        try:
            response = self.adapter.list_security_groups()
            all_security_groups = response.get("SecurityGroups", [])
            
            if vpc_id:
                filtered_security_groups = [sg for sg in all_security_groups if sg.get("VpcId") == vpc_id]
            else:
                filtered_security_groups = all_security_groups

            # We need to serialize the response to be JSON-friendly
            result = [
                {
                    "group_id": sg.get("GroupId"),
                    "group_name": sg.get("GroupName"),
                    "description": sg.get("Description"),
                    "vpc_id": sg.get("VpcId"),
                    "ingress_rules": sg.get("IpPermissions", []),
                    "egress_rules": sg.get("IpPermissionsEgress", []),
                }
                for sg in filtered_security_groups
            ]
            
            self.logger.info(f"Found {len(result)} security groups.")
            return {"security_groups": result}
        except Exception as e:
            self.logger.error(f"Failed to list security groups: {e}")
            return {"error": str(e)}