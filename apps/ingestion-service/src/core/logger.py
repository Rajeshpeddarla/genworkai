import sys
from loguru import logger

# Configure JSON structured logging for production
logger.remove()
logger.add(
    sys.stdout,
    format="{time} {level} {message}",
    serialize=True,
    level="INFO"
)

def get_logger(context_kwargs: dict = None):
    if context_kwargs:
        return logger.bind(**context_kwargs)
    return logger
