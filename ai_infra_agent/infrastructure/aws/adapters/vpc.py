from typing import List, Dict, Any, Optional
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase


class VpcAdapter(AWSAdapterBase):
    """
    Adapter for interacting with AWS VPC, Subnets, and related networking resources.
    """

    def __init__(self, logger: logger, aws_config: Dict[str, Any]):
        """
        Initializes the VPC adapter. Note that VPC resources are managed via the 'ec2' client.

        Args:
            logger (Logger): The logger instance.
            aws_config (Dict[str, Any]): User-specific AWS credentials.
        """
        super().__init__(service_name="ec2", logger=logger, aws_config=aws_config)

    def list_vpcs(self, vpc_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Lists VPCs.

        Args:
            vpc_ids (Optional[List[str]], optional): A list of VPC IDs to filter by. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the describe_vpcs call.
        """
        self.logger.info(f"Listing VPCs with IDs: {vpc_ids}")
        try:
            if vpc_ids:
                return self.client.describe_vpcs(VpcIds=vpc_ids)
            else:
                return self.client.describe_vpcs()
        except Exception as e:
            self.logger.error(f"Error listing VPCs: {e}")
            raise

    def list_subnets(self, vpc_id: str) -> Dict[str, Any]:
        """
        Lists subnets within a specific VPC.

        Args:
            vpc_id (str): The ID of the VPC to list subnets for.

        Returns:
            Dict[str, Any]: The response from the describe_subnets call.
        """
        self.logger.info(f"Listing subnets for VPC ID: {vpc_id}")
        try:
            return self.client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
        except Exception as e:
            self.logger.error(f"Error listing subnets for VPC '{vpc_id}': {e}")
            raise

    def create_vpc(self, cidr_block: str, tags: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Creates a new VPC.

        Args:
            cidr_block (str): The CIDR block for the VPC.
            tags (Optional[List[Dict[str, str]]], optional): A list of tags to apply. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the create_vpc call.
        """
        self.logger.info(f"Creating VPC with CIDR block: {cidr_block}")
        try:
            params = {'CidrBlock': cidr_block}
            if tags:
                params['TagSpecifications'] = [{'ResourceType': 'vpc', 'Tags': tags}]
            
            response = self.client.create_vpc(**params)
            self.logger.info(f"VPC created: {response.get('Vpc', {}).get('VpcId')}")
            return response.get('Vpc', {})
        except Exception as e:
            self.logger.error(f"Error creating VPC: {e}")
            raise

    def create_internet_gateway(self, tags: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Creates a new Internet Gateway.

        Args:
            tags (Optional[List[Dict[str, str]]], optional): A list of tags to apply. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the create_internet_gateway call.
        """
        self.logger.info("Creating Internet Gateway.")
        try:
            params = {}
            if tags:
                params['TagSpecifications'] = [{'ResourceType': 'internet-gateway', 'Tags': tags}]
            response = self.client.create_internet_gateway(**params)
            self.logger.info(f"Internet Gateway created: {response.get('InternetGateway', {}).get('InternetGatewayId')}")
            return response.get('InternetGateway', {})
        except Exception as e:
            self.logger.error(f"Error creating Internet Gateway: {e}")
            raise

    def attach_internet_gateway(self, internet_gateway_id: str, vpc_id: str) -> Dict[str, Any]:
        """
        Attaches an Internet Gateway to a VPC.

        Args:
            internet_gateway_id (str): The ID of the Internet Gateway.
            vpc_id (str): The ID of the VPC.

        Returns:
            Dict[str, Any]: The response from the attach_internet_gateway call.
        """
        self.logger.info(f"Attaching Internet Gateway '{internet_gateway_id}' to VPC '{vpc_id}'.")
        try:
            self.client.attach_internet_gateway(InternetGatewayId=internet_gateway_id, VpcId=vpc_id)
            self.logger.info(f"Internet Gateway '{internet_gateway_id}' successfully attached to VPC '{vpc_id}'.")
            return {"status": "success", "internet_gateway_id": internet_gateway_id, "vpc_id": vpc_id}
        except Exception as e:
            self.logger.error(f"Error attaching Internet Gateway '{internet_gateway_id}' to VPC '{vpc_id}': {e}")
            raise

    def create_subnet(self, vpc_id: str, cidr_block: str, availability_zone: Optional[str] = None, tags: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Creates a new subnet within a specified VPC.

        Args:
            vpc_id (str): The ID of the VPC to create the subnet in.
            cidr_block (str): The CIDR block for the subnet.
            availability_zone (Optional[str], optional): The Availability Zone for the subnet. Defaults to None.
            tags (Optional[List[Dict[str, str]]], optional): A list of tags to apply. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the create_subnet call.
        """
        self.logger.info(f"Creating subnet with CIDR block '{cidr_block}' in VPC '{vpc_id}' (AZ: {availability_zone}).")
        try:
            params = {
                'VpcId': vpc_id,
                'CidrBlock': cidr_block,
            }
            if availability_zone:
                params['AvailabilityZone'] = availability_zone
            if tags:
                params['TagSpecifications'] = [{'ResourceType': 'subnet', 'Tags': tags}]
            
            response = self.client.create_subnet(**params)
            self.logger.info(f"Subnet created: {response.get('Subnet', {}).get('SubnetId')}")
            return response.get('Subnet', {})
        except Exception as e:
            self.logger.error(f"Error creating subnet in VPC '{vpc_id}': {e}")
            raise

    def modify_subnet_attribute(self, subnet_id: str, map_public_ip_on_launch: bool) -> Dict[str, Any]:
        """
        Modifies a subnet's attributes, specifically to enable/disable auto-assign public IP.

        Args:
            subnet_id (str): The ID of the subnet to modify.
            map_public_ip_on_launch (bool): Whether to enable auto-assign public IP for instances launched in this subnet.

        Returns:
            Dict[str, Any]: The response from the modify_subnet_attribute call.
        """
        self.logger.info(f"Modifying subnet '{subnet_id}' to set map_public_ip_on_launch to {map_public_ip_on_launch}.")
        try:
            response = self.client.modify_subnet_attribute(
                SubnetId=subnet_id,
                MapPublicIpOnLaunch={'Value': map_public_ip_on_launch}
            )
            self.logger.info(f"Subnet '{subnet_id}' attribute modified successfully.")
            return {"status": "success", "subnet_id": subnet_id, "map_public_ip_on_launch": map_public_ip_on_launch}
        except Exception as e:
            self.logger.error(f"Error modifying subnet '{subnet_id}' attribute: {e}")
            raise
