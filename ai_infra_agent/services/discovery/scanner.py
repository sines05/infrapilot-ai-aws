from typing import List, Dict, Any
from ai_infra_agent.state.schemas import ResourceState, InfrastructureState
from ai_infra_agent.core.logging import logger
from ai_infra_agent.infrastructure.tool_factory import ToolFactory

# Import specific tools that the scanner will use
from ai_infra_agent.infrastructure.aws.tools.ec2 import ListEC2InstancesTool, ListAvailabilityZonesTool # Needed for region
from ai_infra_agent.infrastructure.aws.tools.vpc import ListVpcsTool
from ai_infra_agent.infrastructure.aws.tools.security_group import ListSecurityGroupsTool
from ai_infra_agent.infrastructure.aws.tools.rds import ListRDSInstancesTool, ListDbSubnetGroupsTool


class DiscoveryScanner:
    """
    Scans for existing cloud resources to import them into the managed state.
    All AWS operations use user-specific credentials passed via user_aws_config.
    """
    def __init__(self, tool_factory: ToolFactory, user_aws_config: Dict[str, Any]):
        self.tool_factory = tool_factory
        self.user_aws_config = user_aws_config
        self.logger = logger # Assuming logger is already configured

        # Validate that user_aws_config has at least a region
        if not self.user_aws_config.get("region"):
            raise ValueError("user_aws_config must contain a 'region' key for DiscoveryScanner.")

    async def scan_aws_resources(self) -> InfrastructureState:
        """
        Scans various AWS resources and returns them as an InfrastructureState object.
        """
        discovered_resources: Dict[str, ResourceState] = {}

        # Get region from user_aws_config to ensure all operations are in the correct region
        aws_region = self.user_aws_config["region"]
        self.logger.info(f"Starting AWS resource discovery in region: {aws_region}...")

        # Scan EC2 instances
        ec2_resources = await self._scan_ec2_instances()
        for res in ec2_resources:
            discovered_resources[res.id] = res

        # Scan VPCs
        vpc_resources = await self._scan_vpcs()
        for res in vpc_resources:
            discovered_resources[res.id] = res

        # Scan Security Groups
        sg_resources = await self._scan_security_groups()
        for res in sg_resources:
            discovered_resources[res.id] = res

        # Scan RDS DB Subnet Groups
        rds_db_subnet_group_resources = await self._scan_rds_db_subnet_groups()
        for res in rds_db_subnet_group_resources:
            discovered_resources[res.id] = res

        # Scan RDS DB Instances
        rds_db_instance_resources = await self._scan_rds_db_instances()
        for res in rds_db_instance_resources:
            discovered_resources[res.id] = res

        self.logger.info(f"Finished AWS resource discovery. Found {len(discovered_resources)} resources.")
        return InfrastructureState(resources=discovered_resources)

    async def _scan_rds_db_subnet_groups(self) -> List[ResourceState]:
        """
        Scans for RDS DB Subnet Groups and converts them to ResourceState objects.
        """
        resources: List[ResourceState] = []
        try:
            # Get the RDS adapter from the tool factory
            describe_db_subnet_groups_tool = self.tool_factory.get_tool("list-db-subnet-groups", self.user_aws_config) # Assuming such a tool exists or RDSAdapter has this directly
            response = describe_db_subnet_groups_tool.execute() # Assuming execute method
            self.logger.debug(f"Raw RDS describe_db_subnet_groups response: {response}")

            for db_subnet_group in response.get('DBSubnetGroups', []):
                group_name = db_subnet_group.get('DBSubnetGroupName')
                resources.append(ResourceState(
                    id=group_name,
                    name=group_name,
                    type='aws_rds_db_subnet_group',
                    status=db_subnet_group.get('SubnetGroupStatus', 'unknown'),
                    properties=db_subnet_group,
                    tags={tag['Key']: tag['Value'] for tag in db_subnet_group.get('Tags', []) if 'Key' in tag and 'Value' in tag}
                ))
            self.logger.debug(f"Discovered {len(resources)} RDS DB Subnet Groups.")
        except Exception as e:
            self.logger.error(f"Error scanning RDS DB Subnet Groups: {e}")
        return resources

    async def _scan_rds_db_instances(self) -> List[ResourceState]:
        """
        Scans for RDS DB Instances and converts them to ResourceState objects.
        """
        resources: List[ResourceState] = []
        try:
            # Get the RDS adapter from the tool factory
            list_rds_instances_tool = self.tool_factory.get_tool("list-rds-instances", self.user_aws_config)
            response = list_rds_instances_tool.execute() # Assuming execute method
            self.logger.debug(f"Raw RDS describe_db_instances response: {response}")

            for db_instance in response.get('DBInstances', []):
                instance_id = db_instance.get('DBInstanceIdentifier')
                instance_name = instance_id
                # Attempt to get name from tags if available
                if db_instance.get('TagList'):
                    for tag in db_instance['TagList']:
                        if tag.get('Key') == 'Name':
                            instance_name = tag.get('Value')
                            break

                resources.append(ResourceState(
                    id=instance_id,
                    name=instance_name,
                    type='aws_rds_instance',
                    status=db_instance.get('DBInstanceStatus', 'unknown'),
                    properties=db_instance,
                    tags={tag['Key']: tag['Value'] for tag in db_instance.get('TagList', []) if 'Key' in tag and 'Value' in tag}
                ))
            self.logger.debug(f"Discovered {len(resources)} RDS DB Instances.")
        except Exception as e:
            self.logger.error(f"Error scanning RDS DB Instances: {e}")
        return resources

    async def _scan_ec2_instances(self) -> List[ResourceState]:
        """
        Scans for EC2 instances and converts them to ResourceState objects.
        """
        resources: List[ResourceState] = []
        try:
            # Get the ListEC2InstancesTool from the tool factory
            list_ec2_tool = self.tool_factory.get_tool("list-ec2-instances", self.user_aws_config)
            response = list_ec2_tool.execute() # Assuming execute method
            self.logger.debug(f"Raw EC2 describe_instances response: {response}")

            for reservation in response.get('Reservations', []):
                for instance in reservation.get('Instances', []):
                    instance_id = instance.get('InstanceId')
                    instance_name = ''
                    for tag in instance.get('Tags', []):
                        if tag.get('Key') == 'Name':
                            instance_name = tag.get('Value')
                            break
                    
                    resources.append(ResourceState(
                        id=instance_id,
                        name=instance_name if instance_name else instance_id,
                        type='aws_ec2_instance',
                        status=instance.get('State', {}).get('Name', 'unknown'),
                        properties=instance, # Store full instance details in properties
                        tags={tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                    ))
            self.logger.debug(f"Discovered {len(resources)} EC2 instances.")
        except Exception as e:
            self.logger.error(f"Error scanning EC2 instances: {e}")
        return resources

    async def _scan_vpcs(self) -> List[ResourceState]:
        """
        Scans for VPCs and converts them to ResourceState objects.
        """
        resources: List[ResourceState] = []
        try:
            # Get the ListVpcsTool from the tool factory
            list_vpcs_tool = self.tool_factory.get_tool("list-vpcs", self.user_aws_config)
            response = list_vpcs_tool.execute() # Assuming execute method
            self.logger.debug(f"Raw VPC describe_vpcs response: {response}")

            for vpc in response.get('vpcs', []):
                vpc_id = vpc.get('vpc_id')
                vpc_name = ''
                for tag in vpc.get('tags', []):
                    if tag.get('Key') == 'Name':
                        vpc_name = tag.get('Value')
                        break

                resources.append(ResourceState(
                    id=vpc_id,
                    name=vpc_name if vpc_name else vpc_id,
                    type='aws_vpc',
                    status=vpc.get('state', 'unknown'),
                    properties=vpc,
                    tags={tag['Key']: tag['Value'] for tag in vpc.get('tags', [])}
                ))
            self.logger.debug(f"Discovered {len(resources)} VPCs.")
        except Exception as e:
            self.logger.error(f"Error scanning VPCs: {e}")
        return resources

    async def _scan_security_groups(self) -> List[ResourceState]:
        """
        Scans for Security Groups and converts them to ResourceState objects.
        """
        resources: List[ResourceState] = []
        try:
            # Get the ListSecurityGroupsTool from the tool factory
            list_sg_tool = self.tool_factory.get_tool("list-security-groups", self.user_aws_config)
            response = list_sg_tool.execute() # Assuming execute method
            self.logger.debug(f"Raw Security Group describe_security_groups response: {response}")

            for sg in response.get('security_groups', []):
                sg_id = sg.get('group_id')
                sg_name = sg.get('group_name')
                
                resources.append(ResourceState(
                    id=sg_id,
                    name=sg_name if sg_name else sg_id,
                    type='aws_security_group',
                    status='available', # Security groups don't have a 'state' like instances
                    properties=sg,
                    tags={tag['Key']: tag['Value'] for tag in sg.get('tags', []) if 'Key' in tag and 'Value' in tag}
                ))
            self.logger.debug(f"Discovered {len(resources)} Security Groups.")
        except Exception as e:
            self.logger.error(f"Error scanning Security Groups: {e}")
        return resources