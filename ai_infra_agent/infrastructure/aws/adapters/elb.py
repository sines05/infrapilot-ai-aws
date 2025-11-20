from typing import Dict, Any, Optional, List
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase


class ElbAdapter(AWSAdapterBase):
    """
    Adapter for interacting with the AWS Elastic Load Balancing (ELBv2) service.
    """

    def __init__(self, logger: logger, aws_config: Dict[str, Any]):
        """
        Initializes the ELB adapter.

        Args:
            logger (Logger): The logger instance.
            aws_config (Dict[str, Any]): User-specific AWS credentials.
        """
        super().__init__(service_name="elbv2", logger=logger, aws_config=aws_config)

    def create_load_balancer(
        self,
        name: str,
        subnet_ids: List[str],
        security_group_ids: Optional[List[str]] = None,
        lb_type: str = 'application', # 'application' or 'network'
        scheme: str = 'internet-facing', # 'internet-facing' or 'internal'
        tags: Optional[List[Dict[str, str]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Creates a new Application or Network Load Balancer.

        Args:
            name (str): The name of the load balancer.
            subnet_ids (List[str]): A list of subnet IDs for the load balancer.
            security_group_ids (Optional[List[str]]): A list of security group IDs for the load balancer.
            lb_type (str): The type of load balancer. 'application' or 'network'. Defaults to 'application'.
            scheme (str): The load balancer's scheme. 'internet-facing' or 'internal'. Defaults to 'internet-facing'.
            tags (Optional[List[Dict[str, str]]]): Tags to apply.

        Returns:
            Dict[str, Any]: The response from the create_load_balancer call.
        """
        self.logger.info(f"Creating {lb_type} load balancer '{name}' with scheme '{scheme}'.")
        try:
            params = {
                'Name': name,
                'Subnets': subnet_ids,
                'Type': lb_type,
                'Scheme': scheme,
            }
            if security_group_ids:
                params['SecurityGroups'] = security_group_ids
            if tags:
                params['Tags'] = tags
            
            response = self.client.create_load_balancer(**params)
            self.logger.info(f"Load balancer created: {response.get('LoadBalancers', [{}])[0].get('LoadBalancerArn')}")
            return response.get('LoadBalancers', [{}])[0]
        except Exception as e:
            self.logger.error(f"Error creating load balancer: {e}")
            raise
