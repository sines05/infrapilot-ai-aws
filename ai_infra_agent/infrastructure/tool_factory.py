from typing import Dict, List, Any, Type, Tuple
from loguru import logger

# Adapter Imports (these are now just class references)
from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter
from ai_infra_agent.infrastructure.aws.adapters.vpc import VpcAdapter
from ai_infra_agent.infrastructure.aws.adapters.key_pair import KeyPairAdapter
from ai_infra_agent.infrastructure.aws.adapters.rds import RdsAdapter
from ai_infra_agent.infrastructure.aws.adapters.security_group import SecurityGroupAdapter
from ai_infra_agent.infrastructure.aws.adapters.elb import ElbAdapter
from ai_infra_agent.infrastructure.aws.adapters.s3 import S3Adapter

# Tool Imports (these are now just class references)
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool
from ai_infra_agent.infrastructure.aws.tools.ec2 import (
    CreateEC2InstanceTool,
    ListEC2InstancesTool,
    TerminateEC2InstanceTool,
    StartInstanceTool,
    StopInstanceTool,
    CreateVolumeTool,
    ListAvailabilityZonesTool,
)
from ai_infra_agent.infrastructure.aws.tools.ami import GetLatestAmazonLinuxAMITool, GetLatestUbuntuAmiTool
from ai_infra_agent.infrastructure.aws.tools.keypair import CreateKeyPairTool, ListKeyPairsTool
from ai_infra_agent.infrastructure.aws.tools.vpc import (
    GetDefaultVPCTool,
    ListSubnetsTool,
    ListVpcsTool,
    CreateVpcTool,
    ListSubnetsForAlbTool,
    CreateInternetGatewayTool,
    AttachInternetGatewayTool,
    CreatePublicSubnetTool,
)
from ai_infra_agent.infrastructure.aws.tools.rds import ListRDSInstancesTool, CreateDbSubnetGroupTool, CreateDbInstanceTool, ListDbSubnetGroupsTool
from ai_infra_agent.infrastructure.aws.tools.security_group import (
    CreateSecurityGroupTool,
    AddSecurityGroupIngressRuleTool,
    ListSecurityGroupsTool,
    AddSecurityGroupEgressRuleTool,
    DeleteSecurityGroupTool,
    GetSecurityGroupRulesTool,
)
from ai_infra_agent.infrastructure.aws.tools.elb import CreateLoadBalancerTool
from ai_infra_agent.infrastructure.aws.tools.s3 import CreateS3BucketTool


class ToolFactory:
    """
    Factory class to create and manage tools.
    This factory is responsible for mapping tool names to their corresponding
    Tool and Adapter classes, and for instantiating them with user-specific
    credentials on demand.
    """

    # Type alias for the tool registry entry
    ToolRegistryEntry = Tuple[Type[BaseTool], Type[Any], str, str] # ToolClass, AdapterClass, service_name, description

    def __init__(self, logger: logger):
        """
        Initializes the ToolFactory and registers all available tool classes.
        """
        self.logger = logger
        self._tool_registry: Dict[str, ToolRegistryEntry] = {}
        self.logger.info("ToolFactory initialized. Registering tool classes...")
        self._init_tool_registry()

    def _init_tool_registry(self):
        """
        Registers all tool classes and their associated adapter classes and service names.
        Descriptions are hardcoded here for simplicity, or could be fetched from tool classes.
        """
        # --- EC2 Tools ---
        self._register_tool_class("create-ec2-instance", CreateEC2InstanceTool, EC2Adapter, "ec2", "Creates a new EC2 instance.")
        self._register_tool_class("list-ec2-instances", ListEC2InstancesTool, EC2Adapter, "ec2", "Lists EC2 instances.")
        self._register_tool_class("terminate-ec2-instance", TerminateEC2InstanceTool, EC2Adapter, "ec2", "Terminates one or more EC2 instances.")
        self._register_tool_class("start-ec2-instance", StartInstanceTool, EC2Adapter, "ec2", "Starts an EC2 instance.")
        self._register_tool_class("stop-instance", StopInstanceTool, EC2Adapter, "ec2", "Stops one or more EC2 instances.")
        self._register_tool_class("create-volume", CreateVolumeTool, EC2Adapter, "ec2", "Creates a new EBS volume.")
        self._register_tool_class("list-availability-zones", ListAvailabilityZonesTool, EC2Adapter, "ec2", "Lists all Availability Zones.")

        # --- AMI Tools ---
        self._register_tool_class("get-latest-amazon-linux-ami", GetLatestAmazonLinuxAMITool, EC2Adapter, "ec2", "Gets the latest Amazon Linux AMI.")
        self._register_tool_class("get-latest-ubuntu-ami", GetLatestUbuntuAmiTool, EC2Adapter, "ec2", "Gets the latest Ubuntu AMI.")

        # --- KeyPair Tools ---
        self._register_tool_class("create-key-pair", CreateKeyPairTool, KeyPairAdapter, "ec2", "Creates a new EC2 key pair.")
        self._register_tool_class("list-key-pairs", ListKeyPairsTool, KeyPairAdapter, "ec2", "Lists all EC2 key pairs.")
        
        # --- VPC Tools ---
        self._register_tool_class("get-default-vpc", GetDefaultVPCTool, VpcAdapter, "ec2", "Gets the default VPC.")
        self._register_tool_class("list-subnets", ListSubnetsTool, VpcAdapter, "ec2", "Lists subnets within a specific VPC.")
        self._register_tool_class("list-vpcs", ListVpcsTool, VpcAdapter, "ec2", "Lists VPCs.")
        self._register_tool_class("create-vpc", CreateVpcTool, VpcAdapter, "ec2", "Creates a new VPC.")
        self._register_tool_class("list-subnets-for-alb", ListSubnetsForAlbTool, VpcAdapter, "ec2", "Lists subnets suitable for an ALB.")
        self._register_tool_class("create-internet-gateway", CreateInternetGatewayTool, VpcAdapter, "ec2", "Creates a new Internet Gateway.")
        self._register_tool_class("attach-internet-gateway", AttachInternetGatewayTool, VpcAdapter, "ec2", "Attaches an Internet Gateway to a VPC.")
        self._register_tool_class("create-public-subnet", CreatePublicSubnetTool, VpcAdapter, "ec2", "Creates a public subnet.")

        # --- RDS Tools ---
        self._register_tool_class("list-rds-instances", ListRDSInstancesTool, RdsAdapter, "rds", "Lists all RDS instances.")
        self._register_tool_class("list-db-subnet-groups", ListDbSubnetGroupsTool, RdsAdapter, "rds", "Lists all RDS DB Subnet Groups.")
        self._register_tool_class("create-db-subnet-group", CreateDbSubnetGroupTool, RdsAdapter, "rds", "Creates a new DB subnet group.")
        self._register_tool_class("create-db-instance", CreateDbInstanceTool, RdsAdapter, "rds", "Creates a new DB instance.")

        # --- Security Group Tools ---
        self._register_tool_class("create-security-group", CreateSecurityGroupTool, SecurityGroupAdapter, "ec2", "Creates a new EC2 security group.")
        self._register_tool_class("add-security-group-ingress-rule", AddSecurityGroupIngressRuleTool, SecurityGroupAdapter, "ec2", "Adds an ingress rule to a security group.")
        self._register_tool_class("list-security-groups", ListSecurityGroupsTool, SecurityGroupAdapter, "ec2", "Lists all EC2 security groups.")
        self._register_tool_class("add-security-group-egress-rule", AddSecurityGroupEgressRuleTool, SecurityGroupAdapter, "ec2", "Adds an egress rule to a security group.")
        self._register_tool_class("delete-security-group", DeleteSecurityGroupTool, SecurityGroupAdapter, "ec2", "Deletes an EC2 security group.")
        self._register_tool_class("get-security-group-rules", GetSecurityGroupRulesTool, SecurityGroupAdapter, "ec2", "Retrieves the rules of a security group.")

        # --- ELB Tools ---
        self._register_tool_class("create-load-balancer", CreateLoadBalancerTool, ElbAdapter, "elbv2", "Creates a new Application or Network Load Balancer.")

        # --- S3 Tools ---
        self._register_tool_class("create-s3-bucket", CreateS3BucketTool, S3Adapter, "s3", "Creates a new S3 bucket.")

        self.logger.info(f"Registered {len(self._tool_registry)} tool classes.")

    def _register_tool_class(self, name: str, tool_class: Type[BaseTool], adapter_class: Type[Any], service_name: str, description: str):
        """Helper to register a tool class."""
        self.logger.debug(f"Registering tool class: {name}")
        self._tool_registry[name] = (tool_class, adapter_class, service_name, description)

    def get_tool_names(self) -> List[str]:
        """Returns a list of registered tool names."""
        return list(self._tool_registry.keys())

    def get_all_tool_info(self) -> List[Dict[str, Any]]:
        """
        Returns a list of dictionaries, each containing the name and description of a registered tool.
        """
        tool_info_list = []
        for tool_name, (tool_class, _, _, description) in self._tool_registry.items():
            tool_info_list.append({"name": tool_name, "description": description})
        return tool_info_list

    def get_tool(self, tool_name: str, user_aws_config: Dict[str, Any]) -> BaseTool:
        """
        Retrieves and instantiates a tool with user-specific AWS credentials.

        Args:
            tool_name (str): The name of the tool to retrieve.
            user_aws_config (Dict[str, Any]): The AWS configuration specific to the user.

        Returns:
            BaseTool: An instantiated tool configured with the user's credentials.

        Raises:
            ValueError: If the tool name is not found or if aws_config is invalid.
        """
        self.logger.debug(f"Attempting to get tool '{tool_name}' with user-specific AWS config.")
        
        if tool_name not in self._tool_registry:
            self.logger.error(f"Tool '{tool_name}' not found in registry.")
            raise ValueError(f"Tool '{tool_name}' not found.")

        tool_class, adapter_class, service_name, _ = self._tool_registry[tool_name]

        try:
            # Instantiate the adapter with the user's AWS config
            adapter_instance = adapter_class(logger=self.logger, aws_config=user_aws_config)
            
            # Instantiate the tool with the adapter
            tool_instance = tool_class(self.logger, adapter_instance)
            
            self.logger.debug(f"Successfully created tool '{tool_name}' for user.")
            return tool_instance
        except ValueError as ve:
            self.logger.error(f"Configuration error for tool '{tool_name}': {ve}")
            raise # Re-raise config errors for user feedback
        except Exception as e:
            self.logger.error(f"Failed to instantiate tool '{tool_name}': {e}", exc_info=True)
            raise RuntimeError(f"Failed to create tool '{tool_name}'.")