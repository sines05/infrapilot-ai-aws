import sys
from loguru import logger
from ai_infra_agent.core.config import Settings, ROOT_DIR # Import ROOT_DIR

# Create a dedicated logger for LLM requests
llm_request_logger = logger.bind(name="llm_request", propagate=False)

def setup_logger(settings: Settings):
    """
    Set up a structured logger for the application.
    """
    logger.remove()
    log_level = settings.logging.level.upper()
    log_format = settings.logging.format

    # Console logging
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

    # File logging for LLM requests
    llm_request_log_path = ROOT_DIR / "llm_request.log"
    llm_request_logger.add(
        llm_request_log_path,
        level="INFO", # Log all LLM requests at INFO level
        format="{message}", # Log only the message content
        rotation="10 MB", # Rotate file every 10 MB
        compression="zip", # Compress old log files
        serialize=False, # Do not serialize to JSON for this log
        enqueue=True # Use a queue for non-blocking logging
    )

    return logger
