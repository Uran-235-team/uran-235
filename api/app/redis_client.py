import redis.asyncio as redis

from app.config import settings

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True,
)


async def get_redis() -> redis.Redis:
    """FastAPI dependency that provides a Redis client instance."""
    return redis_client
