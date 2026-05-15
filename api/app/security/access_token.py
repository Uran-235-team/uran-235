import jwt
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.repository import get_user_by_username
from app.auth.service import is_token_valid
from app.config import settings
from app.security.exceptions import AccessTokenError
from db.models.user import User


async def verify_access_token(
    token: str,
    redis_client: aioredis.Redis,
    session: AsyncSession,
) -> User:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise AccessTokenError("Token has expired")
    except jwt.InvalidTokenError:
        raise AccessTokenError("Invalid token")

    if payload.get("type") != "access":
        raise AccessTokenError("Invalid token type")

    username = payload.get("sub")
    if not username:
        raise AccessTokenError("Invalid token payload")

    if not await is_token_valid(redis_client, username, token, "access"):
        raise AccessTokenError("Token has been revoked")

    user = await get_user_by_username(session, username)
    if not user:
        raise AccessTokenError("User not found")

    return user
