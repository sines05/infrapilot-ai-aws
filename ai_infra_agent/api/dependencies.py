from functools import lru_cache
from loguru import logger

# --- Core Imports ---
from ai_infra_agent.core.config import settings
from ai_infra_agent.core.logging import setup_logger

# --- State Imports ---
from ai_infra_agent.state.manager import StateManager

# --- Infrastructure Imports ---
# The factory now manages its own dependencies internally.
from ai_infra_agent.infrastructure.tool_factory import ToolFactory

# --- Agent & Discovery Imports ---
from ai_infra_agent.agent.agent import StateAwareAgent
from ai_infra_agent.services.discovery.scanner import DiscoveryScanner


# The @lru_cache(maxsize=None) decorator turns these functions into singleton factories.

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
    return StateManager(log)


@lru_cache(maxsize=None)
def get_tool_factory() -> ToolFactory:
    """
    Dependency function that provides a singleton ToolFactory instance.
    The factory is now responsible for its own setup and tool registration.
    """
    log = get_logger()
    log.info("Initializing ToolFactory singleton...")
    # The factory's __init__ now handles all adapter/tool registration.
    factory = ToolFactory(logger=log)
    log.info(f"ToolFactory initialized with {len(factory.get_tool_names())} tools.")
    return factory

@lru_cache(maxsize=None)
def get_scanner() -> DiscoveryScanner:
    """
    Dependency function that provides a singleton DiscoveryScanner instance.
    """
    log = get_logger()
    tool_factory = get_tool_factory()
    log.info("Initializing DiscoveryScanner singleton...")
    return DiscoveryScanner(tool_factory=tool_factory)


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
        logger=log,
        scanner=get_scanner()
    )
