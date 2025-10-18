from functools import lru_cache
from loguru import logger

# --- Core Imports ---
from ai_infra_agent.core.config import settings
from ai_infra_agent.core.logging import setup_logger

# --- State Imports ---
from ai_infra_agent.state.manager import StateManager

# --- Infrastructure Imports ---
from ai_infra_agent.infrastructure.aws.adapters.ec2 import EC2Adapter
from ai_infra_agent.infrastructure.tool_factory import ToolFactory

# --- AWS Tool Imports ---
from ai_infra_agent.infrastructure.aws.tools.ami import GetLatestAmazonLinuxAMITool
from ai_infra_agent.infrastructure.aws.tools.ec2 import (
    CreateEC2InstanceTool, ListEC2InstancesTool, TerminateEC2InstanceTool
)
from ai_infra_agent.infrastructure.aws.tools.keypair import CreateKeyPairTool, ListKeyPairsTool
from ai_infra_agent.infrastructure.aws.tools.security_group import (
    CreateSecurityGroupTool, AddSecurityGroupIngressRuleTool
)
from ai_infra_agent.infrastructure.aws.tools.vpc import GetDefaultVPCTool, ListSubnetsTool
# Note: The debug tool is also registered here for consistency
from ai_infra_agent.infrastructure.aws.tools.debug import DebugEchoTool

# --- Agent Imports ---
from ai_infra_agent.agent.agent import StateAwareAgent


# The @lru_cache(maxsize=None) decorator turns these functions into singleton factories.
# The first time a function is called, it computes and caches the result.
# Subsequent calls with the same arguments will return the cached result instantly.
# Since these functions have no arguments, they will run only once.

@lru_cache(maxsize=None)
def get_logger() -> logger:
    """
    Dependency function that provides a configured logger instance.
    """
    return setup_logger(settings)


@lru_cache(maxsize=None)
def get_state_manager() -> StateManager:
    """
    Dependency function that provides a singleton StateManager instance.
    """
    log = get_logger()
    log.info("Initializing StateManager singleton...")
    return StateManager(settings.state.file_path, log)


@lru_cache(maxsize=None)
def get_ec2_adapter() -> EC2Adapter:
    """
    Dependency function that provides a singleton EC2Adapter instance.
    """
    log = get_logger()
    log.info("Initializing EC2Adapter singleton...")
    return EC2Adapter(settings.aws, log)


@lru_cache(maxsize=None)
def get_tool_factory() -> ToolFactory:
    """
    Dependency function that provides a singleton ToolFactory instance,
    with all available tools registered.
    """
    log = get_logger()
    ec2_adapter = get_ec2_adapter()
    log.info("Initializing ToolFactory singleton and registering all tools...")

    factory = ToolFactory(logger=log)
    
    # Register all tools
    factory.register_tool("get-latest-amazon-linux-ami", GetLatestAmazonLinuxAMITool(logger=log, adapter=ec2_adapter))
    factory.register_tool("create-ec2-instance", CreateEC2InstanceTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("list-ec2-instances", ListEC2InstancesTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("terminate-ec2-instance", TerminateEC2InstanceTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("create-key-pair", CreateKeyPairTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("list-key-pairs", ListKeyPairsTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("create-security-group", CreateSecurityGroupTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("add-security-group-ingress-rule", AddSecurityGroupIngressRuleTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("get-default-vpc", GetDefaultVPCTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("list-subnets", ListSubnetsTool(logger=log, adapter=ec2_adapter))
    factory.register_tool("debug-echo", DebugEchoTool(logger=log, adapter=ec2_adapter))
    
    log.info(f"ToolFactory initialized with {len(factory.get_tool_names())} tools.")
    return factory


@lru_cache(maxsize=None)
def get_agent() -> StateAwareAgent:
    """
    Dependency function that provides a singleton StateAwareAgent instance.
    """
    log = get_logger()
    log.info("Initializing StateAwareAgent singleton...")
    return StateAwareAgent(
        settings=settings.agent,
        state_manager=get_state_manager(),
        tool_factory=get_tool_factory(),
        logger=log
    )