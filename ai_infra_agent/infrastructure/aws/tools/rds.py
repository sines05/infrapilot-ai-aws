from typing import Dict, Any, Optional, List
from loguru import logger

from ai_infra_agent.infrastructure.aws.adapters.rds import RdsAdapter
from ai_infra_agent.infrastructure.aws.tools.base import BaseTool


class ListRDSInstancesTool(BaseTool):
    """
    Tool to list RDS DB instances.
    """

    def __init__(self, logger: logger, adapter: RdsAdapter):
        """
        Initializes the ListRDSInstancesTool.
        """
        super().__init__(logger=logger, adapter=adapter)
        self.name = "list-rds-instances"
        self.description = "Lists all RDS database instances or a specific instance if an identifier is provided."

    def execute(self, db_instance_identifier: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to list RDS instances.

        Args:
            db_instance_identifier (Optional[str], optional): The identifier of a specific DB instance to list. Defaults to None (list all).

        Returns:
            Dict[str, Any]: The response from the adapter's describe_db_instances call.
        """
        self.logger.info(f"Executing ListRDSInstancesTool for identifier: {db_instance_identifier}")
        try:
            # Call the method on RdsAdapter
            response = self.adapter.describe_db_instances(db_instance_identifier=db_instance_identifier)
            return response
        except Exception as e:
            self.logger.error(f"Failed to list RDS instances: {e}")
            return {"error": str(e)}

class CreateDbSubnetGroupTool(BaseTool):
    """
    Tool to create a new RDS DB Subnet Group.
    """

    def __init__(self, logger: logger, adapter: RdsAdapter):
        """
        Initializes the CreateDbSubnetGroupTool.
        """
        super().__init__(logger, adapter)
        self.name = "create-db-subnet-group"
        self.description = "Creates a new DB Subnet Group for RDS instances."

    def execute(self, db_subnet_group_name: str, db_subnet_group_description: str, subnet_ids: List[str], tags: Optional[List[Dict[str, str]]] = None, **kwargs) -> Dict[str, Any]:
        """
        Executes the tool to create a DB subnet group.

        Args:
            db_subnet_group_name (str): The name for the DB subnet group.
            db_subnet_group_description (str): The description for the DB subnet group.
            subnet_ids (List[str]): A list of subnet IDs to include.
            tags (Optional[List[Dict[str, str]]], optional): Tags to apply. Defaults to None.

        Returns:
            Dict[str, Any]: A dictionary containing the details of the created DB subnet group.
        """
        self.logger.info(f"Executing CreateDbSubnetGroupTool with name: {db_subnet_group_name}")
        try:
            response = self.adapter.create_db_subnet_group(
                db_subnet_group_name=db_subnet_group_name,
                db_subnet_group_description=db_subnet_group_description,
                subnet_ids=subnet_ids,
                tags=tags
            )
            return response
        except Exception as e:
            self.logger.error(f"Failed to create DB subnet group: {e}")
            return {"error": str(e)}

class CreateDbInstanceTool(BaseTool):
    """
    Tool to create a new RDS DB instance.
    """

    def __init__(self, logger: logger, adapter: RdsAdapter):
        """
        Initializes the CreateDbInstanceTool.
        """
        super().__init__(logger, adapter)
        self.name = "create-db-instance"
        self.description = "Creates a new RDS database instance."

    def execute(
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
        Executes the tool to create a DB instance.

        Args:
            db_instance_identifier (str): The DB instance identifier.
            db_instance_class (str): The compute and memory capacity of the DB instance.
            engine (str): The name of the database engine to be used for this instance.
            master_username (str): The name of the master user for the DB instance.
            master_user_password (str): The password for the master user.
            allocated_storage (int): The amount of storage (in gigabytes) to be initially allocated for the DB instance.
            db_subnet_group_name (Optional[str]): The name of the DB subnet group to use for the DB instance.
            vpc_security_group_ids (Optional[List[str]]): A list of EC2 VPC security group IDs to associate with the DB instance.
            engine_version (Optional[str]): The version number of the database engine to use.
            tags (Optional[List[Dict[str, str]]]): Tags to apply.

        Returns:
            Dict[str, Any]: A dictionary containing the details of the created DB instance.
        """
        self.logger.info(f"Executing CreateDbInstanceTool for instance: {db_instance_identifier}")
        try:
            response = self.adapter.create_db_instance(
                db_instance_identifier=db_instance_identifier,
                db_instance_class=db_instance_class,
                engine=engine,
                master_username=master_username,
                master_user_password=master_user_password,
                allocated_storage=allocated_storage,
                db_subnet_group_name=db_subnet_group_name,
                vpc_security_group_ids=vpc_security_group_ids,
                engine_version=engine_version,
                tags=tags
            )
            return response
        except Exception as e:
            self.logger.error(f"Failed to create DB instance: {e}")
            return {"error": str(e)}
