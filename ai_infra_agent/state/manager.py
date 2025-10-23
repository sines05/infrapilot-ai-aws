import json
from pathlib import Path
from typing import Optional

from .schemas import InfrastructureState, ResourceState
from ai_infra_agent.core.logging import logger

class StateManager:
    """
    Manages the state of the infrastructure, handling loading from and saving to a file.
    """

    def __init__(self, state_file_path: str, logger):
        self.state_file = Path(state_file_path)
        self.logger = logger
        self.state: InfrastructureState = self.load_state()

    def load_state(self) -> InfrastructureState:
        """
        Loads the infrastructure state from the state file.
        If the file doesn't exist, it returns a new empty state.
        """
        if not self.state_file.exists():
            self.logger.info(f"State file not found at '{self.state_file}'. Initializing a new state.")
            return InfrastructureState()
        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                return InfrastructureState(**data)
        except (json.JSONDecodeError, TypeError) as e:
            self.logger.error(f"Failed to decode state file at '{self.state_file}': {e}. Starting with a fresh state.")
            return InfrastructureState()

    def save_state(self):
        """
        Saves the current infrastructure state to the state file.
        """
        try:
            self.state_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.state_file, 'w') as f:
                json.dump(self.state.dict(), f, indent=4)
            self.logger.info(f"Successfully saved state to '{self.state_file}'.")
        except IOError as e:
            self.logger.error(f"Failed to save state to '{self.state_file}': {e}")

    def add_resource(self, resource: ResourceState):
        """
        Adds a new resource to the state and saves the state.
        """
        if resource.id in self.state.resources:
            self.logger.warning(f"Resource with ID '{resource.id}' already exists. It will be overwritten.")
        self.state.resources[resource.id] = resource
        self.save_state()
        self.logger.info(f"Added/updated resource '{resource.id}' to the state.")

    def get_resource(self, resource_id: str) -> Optional[ResourceState]:
        """
        Retrieves a resource by its ID from the state.
        """
        return self.state.resources.get(resource_id)

    def remove_resource(self, resource_id: str) -> Optional[ResourceState]:
        """
        Removes a resource by its ID from the state and saves the state.
        """
        if resource_id in self.state.resources:
            resource = self.state.resources.pop(resource_id)
            self.save_state()
            self.logger.info(f"Removed resource '{resource_id}' from the state.")
            return resource
        self.logger.warning(f"Attempted to remove non-existent resource with ID '{resource_id}'.")
        return None

    def get_current_state_formatted(self) -> str:
        """
        Returns a formatted string representation of the current state for the LLM prompt.
        """
        if not self.state.resources:
            return "No managed resources found."

        formatted_output = []
        for resource_id, resource_state in self.state.resources.items():
            # Assuming ResourceState has 'id', 'type', and 'properties' (a dict)
            # Adjust this formatting based on the actual structure of ResourceState
            properties_str = ", ".join([f"{k}:{v}" for k, v in resource_state.properties.items()])
            formatted_output.append(f"- {resource_id} ({resource_state.type}): {resource_state.status} [{properties_str}]")
        
        return "\n".join(formatted_output)
