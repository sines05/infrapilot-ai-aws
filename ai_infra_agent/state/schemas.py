from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ResourceState(BaseModel):
    """
    Represents the state of a single infrastructure resource.
    """
    id: str = Field(..., description="The unique identifier for the resource (e.g., AWS ARN or ID).")
    name: str = Field(..., description="A user-friendly name for the resource.")
    type: str = Field(..., description="The type of the resource (e.g., 'aws_ec2_instance').")
    status: str = Field(..., description="The current status of the resource (e.g., 'running', 'stopped', 'terminated').")
    properties: Dict[str, Any] = Field(default_factory=dict, description="A dictionary of key-value pairs representing the resource's configuration and metadata.")
    tags: Dict[str, str] = Field(default_factory=dict, description="Tags associated with the resource.")
    dependencies: List[str] = Field(default_factory=list, description="A list of resource IDs that this resource depends on.")

class InfrastructureState(BaseModel):
    """
    Represents the overall state of the managed infrastructure,
    containing a collection of all resources.
    """
    resources: Dict[str, ResourceState] = Field(default_factory=dict, description="A mapping from resource ID to resource state.")
