from typing import Dict, Any, Optional, List
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.elb import ElbAdapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class CreateLoadBalancerTool(BaseTool):
    """
    Tool to create a new Application or Network Load Balancer.
    """

    def __init__(self, logger: logger, adapter: ElbAdapter):
        """
        Initializes the CreateLoadBalancerTool.
        """
        super().__init__(logger, adapter)
        self.name = "create-load-balancer"
        self.description = "Creates a new Application or Network Load Balancer."

    def execute(
        self,
        name: str,
        subnet_ids: List[str],
        security_group_ids: Optional[List[str]] = None,
        lb_type: str = 'application',
        scheme: str = 'internet-facing',
        tags: Optional[List[Dict[str, str]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Executes the tool to create a load balancer.

        Args:
            name (str): The name of the load balancer.
            subnet_ids (List[str]): A list of subnet IDs for the load balancer.
            security_group_ids (Optional[List[str]]): A list of security group IDs for the load balancer.
            lb_type (str): The type of load balancer. 'application' or 'network'. Defaults to 'application'.
            scheme (str): The load balancer's scheme. 'internet-facing' or 'internal'. Defaults to 'internet-facing'.
            tags (Optional[List[Dict[str, str]]]): Tags to apply.

        Returns:
            Dict[str, Any]: A dictionary containing the details of the created load balancer.
        """
        self.logger.info(f"Executing CreateLoadBalancerTool for LB: {name}")
        try:
            response = self.adapter.create_load_balancer(
                name=name,
                subnet_ids=subnet_ids,
                security_group_ids=security_group_ids,
                lb_type=lb_type,
                scheme=scheme,
                tags=tags
            )
            return response
        except Exception as e:
            self.logger.error(f"Failed to create load balancer: {e}")
            return {"error": str(e)}
