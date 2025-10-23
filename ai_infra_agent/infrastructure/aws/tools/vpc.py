from typing import Dict, Any
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter # VPC operations are often part of EC2 service in boto3
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class GetDefaultVPCTool(BaseTool):
    """
    Tool to find the default VPC ID.
    """

    def __init__(self, logger: logger, adapter: EC2Adapter):
        """
        Initializes the GetDefaultVPCTool.
        """
        super().__init__(logger, adapter)
        self.name = "get-default-vpc"
        self.description = "Finds the ID of the default VPC in the configured region."

    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to get the default VPC ID.

        Returns:
            Dict[str, Any]: A dictionary containing the default VPC ID.
        """
        self.logger.info("Getting default VPC ID...")
        try:
            # Assuming adapter has a method to get default VPC
            # If not, we'll need to add it to EC2Adapter first.
            response = self.adapter.client.describe_vpcs(
                Filters=[
                    {'Name': 'isDefault', 'Values': ['true']}
                ]
            )
            vpcs = response.get('Vpcs', [])
            if not vpcs:
                raise ValueError("No default VPC found.")
            
            default_vpc_id = vpcs[0]['VpcId']
            self.logger.info(f"Found default VPC ID: {default_vpc_id}")
            return {"vpc_id": default_vpc_id}
        except Exception as e:
            self.logger.error(f"Failed to get default VPC: {e}")
            return {"error": str(e)}


class ListSubnetsTool(BaseTool):
    """
    Tool to list subnets in a given VPC.
    """

    def __init__(self, logger, adapter):
        """
        Initializes the ListSubnetsTool.
        """
        super().__init__(logger=logger, adapter=adapter)
        self.name = "list-subnets"
        self.description = "Lists subnets in a specified VPC."

    def execute(self, vpc_id: str, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to list subnets.

        Args:
            vpc_id (str): The ID of the VPC to list subnets from.

        Returns:
            Dict[str, Any]: A dictionary containing the list of subnets.
        """
        self.logger.info(f"Listing subnets for VPC ID: {vpc_id}")
        try:
            response = self.adapter.client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )
            self.logger.debug(f"Raw describe_subnets response: {response}")
            subnets = response.get('Subnets', [])
            self.logger.info(f"Found {len(subnets)} subnets in VPC {vpc_id}.")
            
            # Convert keys to snake_case for consistency
            formatted_subnets = [
                {
                    "subnet_id": subnet.get("SubnetId"),
                    "availability_zone": subnet.get("AvailabilityZone"),
                    "cidr_block": subnet.get("CidrBlock"),
                    "state": subnet.get("State"),
                    "vpc_id": subnet.get("VpcId"),
                    "tags": subnet.get("Tags", [])
                }
                for subnet in subnets
            ]
            return {"subnets": formatted_subnets}
        except Exception as e:
            self.logger.error(f"Failed to list subnets for VPC {vpc_id}: {e}")
            return {"error": str(e)}
