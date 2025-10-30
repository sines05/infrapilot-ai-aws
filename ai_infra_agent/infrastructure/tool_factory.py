from typing import Dict
from loguru import logger

# Adapter Imports
from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter
from ai_infra_agent.infrastructure.aws.adapters.vpc import VpcAdapter
from ai_infra_agent.infrastructure.aws.adapters.key_pair import KeyPairAdapter
from ai_infra_agent.infrastructure.aws.adapters.rds import RdsAdapter
from ai_infra_agent.infrastructure.aws.adapters.security_group import SecurityGroupAdapter
from ai_infra_agent.infrastructure.aws.adapters.elb import ElbAdapter
from ai_infra_agent.infrastructure.aws.adapters.s3 import S3Adapter # New
from ai_infra_agent.core.config import settings

# Tool Imports
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool
from ai_infra_agent.infrastructure.aws.tools.ec2 import (
    CreateEC2InstanceTool,
    ListEC2InstancesTool,
    TerminateEC2InstanceTool,
    StartInstanceTool,
    StopInstanceTool,
    CreateVolumeTool,
)
from ai_infra_agent.infrastructure.aws.tools.ami import GetLatestAmazonLinuxAMITool, GetLatestUbuntuAmiTool
from ai_infra_agent.infrastructure.aws.tools.keypair import CreateKeyPairTool, ListKeyPairsTool
from ai_infra_agent.infrastructure.aws.tools.vpc import GetDefaultVPCTool, ListSubnetsTool, ListVpcsTool, CreateVpcTool, ListSubnetsForAlbTool
from ai_infra_agent.infrastructure.aws.tools.rds import ListRDSInstancesTool, CreateDbSubnetGroupTool, CreateDbInstanceTool
from ai_infra_agent.infrastructure.aws.tools.security_group import (
    CreateSecurityGroupTool,
    AddSecurityGroupIngressRuleTool,
    ListSecurityGroupsTool,
)
from ai_infra_agent.infrastructure.aws.tools.elb import CreateLoadBalancerTool
from ai_infra_agent.infrastructure.aws.tools.s3 import CreateS3BucketTool # New


class ToolFactory:
    """
    Factory class to create and manage tools.
    This factory is responsible for instantiating adapters and tools,
    and wiring them together.
    """

    def __init__(self, logger: logger):
        """
        Initializes the ToolFactory and registers all available tools.
        """
        self.logger = logger
        self._tools: Dict[str, BaseTool] = {}
        self.logger.info("ToolFactory initialized. Registering tools...")
        self._register_all_tools()

    def _register_all_tools(self):
        """
        Instantiates adapters and registers all tools.
        """
        # Instantiate Adapters
        ec2_adapter = EC2Adapter(settings=settings.aws, logger=self.logger)
        vpc_adapter = VpcAdapter(settings=settings.aws, logger=self.logger)
        key_pair_adapter = KeyPairAdapter(settings=settings.aws, logger=self.logger)
        rds_adapter = RdsAdapter(settings=settings.aws, logger=self.logger)
        sg_adapter = SecurityGroupAdapter(settings=settings.aws, logger=self.logger)
        elb_adapter = ElbAdapter(settings=settings.aws, logger=self.logger)
        s3_adapter = S3Adapter(settings=settings.aws, logger=self.logger) # New

        # --- Register Tools ---
        # EC2 Tools
        self.register_tool("create-ec2-instance", CreateEC2InstanceTool(self.logger, ec2_adapter))
        self.register_tool("list-ec2-instances", ListEC2InstancesTool(self.logger, ec2_adapter))
        self.register_tool("terminate-ec2-instance", TerminateEC2InstanceTool(self.logger, ec2_adapter))
        self.register_tool("start-ec2-instance", StartInstanceTool(self.logger, ec2_adapter))
        self.register_tool("stop-ec2-instance", StopInstanceTool(self.logger, ec2_adapter))
        self.register_tool("create-volume", CreateVolumeTool(self.logger, ec2_adapter))

        # AMI Tools
        self.register_tool("get-latest-amazon-linux-ami", GetLatestAmazonLinuxAMITool(self.logger, ec2_adapter))
        self.register_tool("get-latest-ubuntu-ami", GetLatestUbuntuAmiTool(self.logger, ec2_adapter))

        # KeyPair Tools
        self.register_tool("create-key-pair", CreateKeyPairTool(self.logger, key_pair_adapter))
        self.register_tool("list-key-pairs", ListKeyPairsTool(self.logger, key_pair_adapter))
        
        # VPC Tools
        self.register_tool("get-default-vpc", GetDefaultVPCTool(self.logger, vpc_adapter))
        self.register_tool("list-subnets", ListSubnetsTool(self.logger, vpc_adapter))
        self.register_tool("list-vpcs", ListVpcsTool(self.logger, vpc_adapter))
        self.register_tool("create-vpc", CreateVpcTool(self.logger, vpc_adapter))
        self.register_tool("list-subnets-for-alb", ListSubnetsForAlbTool(self.logger, vpc_adapter))

        # RDS Tools
        self.register_tool("list-rds-instances", ListRDSInstancesTool(self.logger, rds_adapter))
        self.register_tool("create-db-subnet-group", CreateDbSubnetGroupTool(self.logger, rds_adapter))
        self.register_tool("create-db-instance", CreateDbInstanceTool(self.logger, rds_adapter))

        # Security Group Tools
        self.register_tool("create-security-group", CreateSecurityGroupTool(self.logger, sg_adapter))
        self.register_tool("add-security-group-ingress-rule", AddSecurityGroupIngressRuleTool(self.logger, sg_adapter))
        self.register_tool("list-security-groups", ListSecurityGroupsTool(self.logger, sg_adapter))

        # ELB Tools
        self.register_tool("create-load-balancer", CreateLoadBalancerTool(self.logger, elb_adapter))

        # S3 Tools (New)
        self.register_tool("create-s3-bucket", CreateS3BucketTool(self.logger, s3_adapter))

        self.logger.info(f"Registered {len(self._tools)} tools.")

    def register_tool(self, name: str, tool: BaseTool):
        """Registers a tool instance."""
        self.logger.info(f"Registering tool: {name}")
        self._tools[name] = tool

    def get_tool_names(self) -> list[str]:
        """Returns a list of registered tool names."""
        return list(self._tools.keys())

    def create_tool(self, tool_name: str) -> BaseTool:
        """
        Retrieves a registered tool instance.
        """
        self.logger.debug(f"Attempting to create tool: {tool_name}")
        tool = self._tools.get(tool_name)
        if not tool:
            self.logger.error(f"Tool '{tool_name}' not found.")
            raise ValueError(f"Tool '{tool_name}' not found.")
        return tool
