import uuid
from datetime import datetime, timedelta, timezone

import jwt
import redis.asyncio as aioredis

from app.config import settings


def create_access_token(data: dict) -> str:
    """Create a new JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({
        "exp": expire,
        "type": "access",
        "jti": str(uuid.uuid4()),
    })
    return jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(data: dict) -> str:
    """Create a new JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    })
    return jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    return jwt.decode(
        token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )


async def store_token(
    redis_client: aioredis.Redis,
    username: str,
    token: str,
    token_type: str,
    expire_minutes: int,
) -> None:
    """Store a token in Redis with TTL."""
    key = f"token:{token_type}:{username}:{token}"
    await redis_client.setex(key, timedelta(minutes=expire_minutes), "valid")


async def revoke_token(
    redis_client: aioredis.Redis,
    username: str,
    token: str,
    token_type: str,
) -> None:
    """Revoke a specific token by deleting it from Redis."""
    key = f"token:{token_type}:{username}:{token}"
    await redis_client.delete(key)


async def is_token_valid(
    redis_client: aioredis.Redis,
    username: str,
    token: str,
    token_type: str,
) -> bool:
    """Check if a token exists (is valid) in Redis."""
    key = f"token:{token_type}:{username}:{token}"
    result = await redis_client.get(key)
    return result is not None


async def revoke_all_user_tokens(
    redis_client: aioredis.Redis, username: str
) -> None:
    """Revoke all tokens for a given user."""
    pattern = f"token:*:{username}:*"
    async for key in redis_client.scan_iter(match=pattern):
        await redis_client.delete(key)
