import sys
from loguru import logger
from ai_infra_agent.core.config import Settings


def setup_logger(settings: Settings):
    """
    Set up a structured logger for the application.
    """
    logger.remove()
    log_level = settings.logging.level.upper()
    log_format = settings.logging.format

    if log_format == "json":
        logger.add(
            sys.stderr,
            level=log_level,
            format="{message}",
            serialize=True,
        )
    else:
        logger.add(
            sys.stderr,
            level=log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                   "<level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
        )

    return logger
