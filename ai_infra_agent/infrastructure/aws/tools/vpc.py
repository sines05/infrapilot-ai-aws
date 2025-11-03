from typing import Dict, Any, Optional, List
from loguru import logger

# Import the new VpcAdapter
from ai_infra_agent.infrastructure.aws.adapters.vpc import VpcAdapter 
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class GetDefaultVPCTool(BaseTool):
    """
    Tool to find the default VPC ID.
    """

    # Expect a VpcAdapter
    def __init__(self, logger: logger, adapter: VpcAdapter):
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
            # Call the adapter's method
            response = self.adapter.list_vpcs()
            
            # Filter for the default VPC in the tool logic
            default_vpc = next((vpc for vpc in response.get('Vpcs', []) if vpc.get('IsDefault')), None)

            if not default_vpc:
                raise ValueError("No default VPC found.")
            
            default_vpc_id = default_vpc['VpcId']
            self.logger.info(f"Found default VPC ID: {default_vpc_id}")
            return {"vpc_id": default_vpc_id}
        except Exception as e:
            self.logger.error(f"Failed to get default VPC: {e}")
            return {"error": str(e)}


class ListSubnetsTool(BaseTool):
    """
    Tool to list subnets in a given VPC.
    """

    # Expect a VpcAdapter
    def __init__(self, logger, adapter: VpcAdapter):
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
            # Call the new adapter method
            response = self.adapter.list_subnets(vpc_id=vpc_id)
            
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

class ListVpcsTool(BaseTool):
    """
    Tool to list all VPCs in the configured region.
    """

    def __init__(self, logger: logger, adapter: VpcAdapter):
        """
        Initializes the ListVpcsTool.
        """
        super().__init__(logger, adapter)
        self.name = "list-vpcs"
        self.description = "Lists all VPCs in the configured region."

    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to list VPCs.

        Returns:
            Dict[str, Any]: A dictionary containing the list of VPCs.
        """
        self.logger.info("Executing ListVpcsTool...")
        try:
            response = self.adapter.list_vpcs()
            # Basic formatting, can be enhanced later
            vpcs = response.get('Vpcs', [])
            formatted_vpcs = [
                {
                    "vpc_id": vpc.get("VpcId"),
                    "is_default": vpc.get("IsDefault"),
                    "cidr_block": vpc.get("CidrBlock"),
                    "state": vpc.get("State"),
                    "tags": vpc.get("Tags", [])
                }
                for vpc in vpcs
            ]
            return {"vpcs": formatted_vpcs}
        except Exception as e:
            self.logger.error(f"Failed to list VPCs: {e}")
            return {"error": str(e)}

class CreateVpcTool(BaseTool):
    """
    Tool to create a new VPC.
    """

    def __init__(self, logger: logger, adapter: VpcAdapter):
        """
        Initializes the CreateVpcTool.
        """
        super().__init__(logger, adapter)
        self.name = "create-vpc"
        self.description = "Creates a new VPC with a specified CIDR block."

    def execute(self, cidr_block: str, tags: Optional[List[Dict[str, str]]] = None, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to create a VPC.

        Args:
            cidr_block (str): The IPv4 CIDR block for the VPC.
            tags (Optional[List[Dict[str, str]]], optional): Tags to apply to the VPC. Defaults to None.

        Returns:
            Dict[str, Any]: A dictionary containing the details of the created VPC.
        """
        self.logger.info(f"Executing CreateVpcTool with CIDR: {cidr_block}")
        try:
            response = self.adapter.create_vpc(cidr_block=cidr_block, tags=tags)
            vpc_id = response.get("VpcId")
            return {"vpc_id": vpc_id, "details": response}
        except Exception as e:
            self.logger.error(f"Failed to create VPC: {e}")
            return {"error": str(e)}

class ListSubnetsForAlbTool(BaseTool):
    """
    Tool to select a list of subnets suitable for an Application Load Balancer.
    It ensures the subnets are in different Availability Zones.
    """

    def __init__(self, logger: logger, adapter: VpcAdapter):
        """
        Initializes the ListSubnetsForAlbTool.
        """
        super().__init__(logger, adapter)
        self.name = "list-subnets-for-alb"
        self.description = "Selects at least two subnets from different Availability Zones within a VPC, suitable for a high-availability Application Load Balancer."

    def execute(self, vpc_id: str, min_azs: int = 2, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to select subnets for an ALB.

        Args:
            vpc_id (str): The ID of the VPC to select subnets from.
            min_azs (int, optional): The minimum number of different Availability Zones required. Defaults to 2.

        Returns:
            Dict[str, Any]: A dictionary containing the list of selected subnet IDs.
        """
        self.logger.info(f"Selecting subnets for ALB in VPC {vpc_id} across at least {min_azs} AZs.")
        try:
            response = self.adapter.list_subnets(vpc_id=vpc_id)
            subnets = response.get('Subnets', [])

            if not subnets:
                raise ValueError(f"No subnets found in VPC {vpc_id}.")

            # Group subnets by Availability Zone
            az_to_subnet = {}
            for subnet in subnets:
                az = subnet.get("AvailabilityZone")
                if az not in az_to_subnet:
                    # Just take the first subnet we find in an AZ
                    az_to_subnet[az] = subnet

            selected_subnets = list(az_to_subnet.values())

            if len(selected_subnets) < min_azs:
                raise ValueError(f"Could not find subnets in at least {min_azs} different Availability Zones. Found only {len(selected_subnets)}.")

            # Return the required number of subnets, but we can return more if available
            final_selection = selected_subnets
            subnet_ids = [subnet['SubnetId'] for subnet in final_selection]
            
            self.logger.info(f"Selected subnets for ALB: {subnet_ids}")
            return {"subnet_ids": subnet_ids, "details": final_selection}

        except Exception as e:
            self.logger.error(f"Failed to select subnets for ALB in VPC {vpc_id}: {e}")
            return {"error": str(e)}
