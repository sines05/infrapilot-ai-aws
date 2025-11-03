from typing import Optional, Dict

from .schemas import InfrastructureState, ResourceState
from ai_infra_agent.core.logging import logger

class StateManager:
    """
    Manages the dynamically discovered state from AWS.
    """

    def __init__(self, logger):
        self.logger = logger
        self.state: InfrastructureState = InfrastructureState() # This will now hold the discovered state

    def set_discovered_state(self, discovered_infra_state: InfrastructureState):
        """
        Sets the dynamically discovered infrastructure state.
        """
        self.state = discovered_infra_state
        self.logger.info(f"Set discovered state with {len(self.state.resources)} resources.")

    def add_resource(self, resource: ResourceState):
        """
        Adds a new resource to the current state.
        """
        if resource.id in self.state.resources:
            self.logger.warning(f"Resource with ID '{resource.id}' already exists. It will be overwritten.")
        self.state.resources[resource.id] = resource
        self.logger.info(f"Added/updated resource '{resource.id}' to the state.")

    def get_current_state_formatted(self) -> str:
        """
        Returns a formatted string representation of the current discovered state for the LLM prompt.
        """
        if not self.state.resources:
            return "No discovered resources found."

        formatted_output = []
        for resource_id, resource_state in self.state.resources.items():
            properties_str = ", ".join([f"{k}:{v}" for k, v in resource_state.properties.items() if k not in ['Tags', 'tagSet']]) # Exclude verbose tags
            tags_str = ", ".join([f"{k}:{v}" for k, v in resource_state.tags.items()])
            
            formatted_output.append(
                f"- ID: {resource_id}\n"
                f"  Name: {resource_state.name}\n"
                f"  Type: {resource_state.type}\n"
                f"  Status: {resource_state.status}\n"
                f"  Properties: {{{properties_str}}}\n"
                f"  Tags: {{{tags_str}}}"
            )
        
        return "\n".join(formatted_output)