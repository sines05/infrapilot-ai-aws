import boto3
from typing import List, Dict, Any
from ai_infra_agent.state.schemas import ResourceState, InfrastructureState
from ai_infra_agent.core.logging import logger
from ai_infra_agent.infrastructure.tool_factory import ToolFactory
from ai_infra_agent.core.config import settings # Import settings

from ai_infra_agent.infrastructure.aws.adapters.rds import RdsAdapter # New

class DiscoveryScanner:
    """
    Scans for existing cloud resources to import them into the managed state.
    """
    def __init__(self, tool_factory: ToolFactory, rds_adapter: RdsAdapter):
        self.tool_factory = tool_factory
        self.logger = logger
        self.rds_adapter = rds_adapter # Store the adapter
        # Initialize boto3 session with region from settings
        self.aws_session = boto3.Session(region_name=settings.aws.region)

    async def scan_aws_resources(self) -> InfrastructureState:
        """
        Scans various AWS resources and returns them as an InfrastructureState object.
        """
        discovered_resources: Dict[str, ResourceState] = {}

        self.logger.info("Starting AWS resource discovery...")

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

        # Scan RDS DB Subnet Groups (New)
        rds_db_subnet_group_resources = await self._scan_rds_db_subnet_groups()
        for res in rds_db_subnet_group_resources:
            discovered_resources[res.id] = res

        self.logger.info(f"Finished AWS resource discovery. Found {len(discovered_resources)} resources.")
        return InfrastructureState(resources=discovered_resources)

    async def _scan_rds_db_subnet_groups(self) -> List[ResourceState]:
        """
        Scans for RDS DB Subnet Groups and converts them to ResourceState objects.
        """
        resources: List[ResourceState] = []
        try:
            response = self.rds_adapter.describe_db_subnet_groups()
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

    async def _scan_ec2_instances(self) -> List[ResourceState]:
        """
        Scans for EC2 instances and converts them to ResourceState objects.
        """
        resources: List[ResourceState] = []
        try:
            ec2_client = self.aws_session.client('ec2', region_name=settings.aws.region)
            response = ec2_client.describe_instances()
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
            ec2_client = self.aws_session.client('ec2', region_name=settings.aws.region)
            response = ec2_client.describe_vpcs()
            self.logger.debug(f"Raw VPC describe_vpcs response: {response}")

            for vpc in response.get('Vpcs', []):
                vpc_id = vpc.get('VpcId')
                vpc_name = ''
                for tag in vpc.get('Tags', []):
                    if tag.get('Key') == 'Name':
                        vpc_name = tag.get('Value')
                        break

                resources.append(ResourceState(
                    id=vpc_id,
                    name=vpc_name if vpc_name else vpc_id,
                    type='aws_vpc',
                    status=vpc.get('State', 'unknown'),
                    properties=vpc,
                    tags={tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
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
            ec2_client = self.aws_session.client('ec2', region_name=settings.aws.region)
            response = ec2_client.describe_security_groups()
            self.logger.debug(f"Raw Security Group describe_security_groups response: {response}")

            for sg in response.get('SecurityGroups', []):
                sg_id = sg.get('GroupId')
                sg_name = sg.get('GroupName')
                
                resources.append(ResourceState(
                    id=sg_id,
                    name=sg_name if sg_name else sg_id,
                    type='aws_security_group',
                    status='available', # Security groups don't have a 'state' like instances
                    properties=sg,
                    tags={tag['Key']: tag['Value'] for tag in sg.get('Tags', []) if 'Key' in tag and 'Value' in tag}
                ))
            self.logger.debug(f"Discovered {len(resources)} Security Groups.")
        except Exception as e:
            self.logger.error(f"Error scanning Security Groups: {e}")
        return resources