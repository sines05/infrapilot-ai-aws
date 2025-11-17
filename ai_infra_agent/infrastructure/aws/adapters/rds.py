from typing import Dict, Any, Optional, List
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.base import AWSAdapterBase
from ai_infra_agent.core.config import AWSSettings


class RdsAdapter(AWSAdapterBase):
    """
    Adapter for interacting with the AWS RDS service.
    """

    def __init__(self, settings: AWSSettings, logger: logger):
        """
        Initializes the RDS adapter.

        Args:
            settings (AWSSettings): The AWS configuration settings.
            logger (Logger): The logger instance.
        """
        super().__init__(service_name="rds", logger=logger, aws_config=None, settings=settings)

    def describe_db_instances(self, db_instance_identifier: Optional[str] = None) -> Dict[str, Any]:
        """
        Describes RDS DB instances.

        Args:
            db_instance_identifier (Optional[str], optional): A specific DB instance identifier to filter by. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the describe_db_instances call.
        """
        self.logger.info(f"Describing RDS DB instances with identifier: {db_instance_identifier}")
        try:
            if db_instance_identifier:
                return self.client.describe_db_instances(DBInstanceIdentifier=db_instance_identifier)
            else:
                return self.client.describe_db_instances()
        except Exception as e:
            self.logger.error(f"Error describing RDS DB instances: {e}")
            raise

    def describe_db_subnet_groups(self, db_subnet_group_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Describes RDS DB Subnet Groups.

        Args:
            db_subnet_group_name (Optional[str], optional): A specific DB subnet group name to filter by. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the describe_db_subnet_groups call.
        """
        self.logger.info(f"Describing RDS DB Subnet Groups with name: {db_subnet_group_name}")
        try:
            if db_subnet_group_name:
                return self.client.describe_db_subnet_groups(DBSubnetGroupName=db_subnet_group_name)
            else:
                return self.client.describe_db_subnet_groups()
        except Exception as e:
            self.logger.error(f"Error describing RDS DB Subnet Groups: {e}")
            raise

    def create_db_subnet_group(self, db_subnet_group_name: str, db_subnet_group_description: str, subnet_ids: List[str], tags: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Creates a new RDS DB Subnet Group.

        Args:
            db_subnet_group_name (str): The name for the DB subnet group.
            db_subnet_group_description (str): The description for the DB subnet group.
            subnet_ids (List[str]): A list of subnet IDs to include.
            tags (Optional[List[Dict[str, str]]], optional): Tags to apply. Defaults to None.

        Returns:
            Dict[str, Any]: The response from the create_db_subnet_group call.
        """
        self.logger.info(f"Creating DB Subnet Group: {db_subnet_group_name}")
        try:
            params = {
                'DBSubnetGroupName': db_subnet_group_name,
                'DBSubnetGroupDescription': db_subnet_group_description,
                'SubnetIds': subnet_ids
            }
            if tags:
                params['Tags'] = tags
            
            response = self.client.create_db_subnet_group(**params)
            self.logger.info(f"DB Subnet Group created: {db_subnet_group_name}")
            return response.get('DBSubnetGroup', {})
        except Exception as e:
            self.logger.error(f"Error creating DB Subnet Group: {e}")
            raise

    def create_db_instance(
        self,
        db_instance_identifier: str,
        db_instance_class: str,
        engine: str,
        master_username: str,
        master_user_password: str,
        allocated_storage: int,
        db_subnet_group_name: Optional[str] = None,
        vpc_security_group_ids: Optional[List[str]] = None,
        engine_version: Optional[str] = None,
        tags: Optional[List[Dict[str, str]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Creates a new RDS DB instance.

        Args:
            db_instance_identifier (str): The DB instance identifier.
            db_instance_class (str): The compute and memory capacity of the DB instance. (e.g., db.t3.micro)
            engine (str): The name of the database engine to be used for this instance. (e.g., mysql)
            master_username (str): The name of the master user for the DB instance.
            master_user_password (str): The password for the master user.
            allocated_storage (int): The amount of storage (in gigabytes) to be initially allocated for the DB instance.
            db_subnet_group_name (Optional[str]): The name of the DB subnet group to use for the DB instance.
            vpc_security_group_ids (Optional[List[str]]): A list of EC2 VPC security group IDs to associate with the DB instance.
            engine_version (Optional[str]): The version number of the database engine to use. (e.g., 8.0)
            tags (Optional[List[Dict[str, str]]]): Tags to apply.

        Returns:
            Dict[str, Any]: The response from the create_db_instance call.
        """
        self.logger.info(f"Creating RDS DB instance: {db_instance_identifier}")
        try:
            params = {
                'DBInstanceIdentifier': db_instance_identifier,
                'DBInstanceClass': db_instance_class,
                'Engine': engine,
                'MasterUsername': master_username,
                'MasterUserPassword': master_user_password,
                'AllocatedStorage': allocated_storage,
            }
            if db_subnet_group_name:
                params['DBSubnetGroupName'] = db_subnet_group_name
            if vpc_security_group_ids:
                params['VpcSecurityGroupIds'] = vpc_security_group_ids
            if engine_version:
                params['EngineVersion'] = engine_version
            if tags:
                params['Tags'] = tags
            
            response = self.client.create_db_instance(**params)
            self.logger.info(f"RDS DB instance created: {db_instance_identifier}")
            return response.get('DBInstance', {})
        except Exception as e:
            self.logger.error(f"Error creating RDS DB instance: {e}")
            raise
