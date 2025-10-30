from typing import List, Dict, Any, Optional
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase
from ai_infra_agent.core.config import AWSSettings


class VpcAdapter(AWSAdapterBase):
    """
    Adapter for interacting with AWS VPC, Subnets, and related networking resources.
    """

    def __init__(self, settings: AWSSettings, logger: logger):
        """
        Initializes the VPC adapter. Note that VPC resources are managed via the 'ec2' client.

        Args:
            settings (AWSSettings): The AWS configuration settings.
            logger (Logger): The logger instance.
        """
        super().__init__(service_name="ec2", settings=settings, logger=logger)

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