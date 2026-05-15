import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.redis_client import get_redis
from app.security.access_token import verify_access_token
from app.security.exceptions import AccessTokenError
from db.models.user import User
from db.session import get_session

__all__ = ["get_current_user", "get_redis", "get_session", "security"]

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    redis_client: aioredis.Redis = Depends(get_redis),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        return await verify_access_token(
            credentials.credentials, redis_client, session
        )
    except AccessTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.detail,
        ) from exc
