import jwt
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.dependencies import get_current_user
from app.auth.mock_users import create_user, get_user, verify_password
from app.auth.schemas import (
    MessageResponse,
    TokenRefresh,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.auth.service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    is_token_valid,
    revoke_all_user_tokens,
    store_token,
)
from app.config import settings
from app.redis_client import get_redis

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    redis_client: aioredis.Redis = Depends(get_redis),
):
    """Register a new user and return JWT token pair."""
    if get_user(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    create_user(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        password=user_data.password,
    )

    token_data = {"sub": user_data.username}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    await store_token(
        redis_client, user_data.username, access_token,
        "access", settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    )
    await store_token(
        redis_client, user_data.username, refresh_token,
        "refresh", settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES,
    )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    user_data: UserLogin,
    redis_client: aioredis.Redis = Depends(get_redis),
):
    """Authenticate user and return JWT token pair."""
    user = get_user(user_data.username)
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token_data = {"sub": user_data.username}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    await store_token(
        redis_client, user_data.username, access_token,
        "access", settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    )
    await store_token(
        redis_client, user_data.username, refresh_token,
        "refresh", settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES,
    )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    token_data: TokenRefresh,
    redis_client: aioredis.Redis = Depends(get_redis),
):
    """Refresh token pair using a valid refresh token."""
    try:
        payload = decode_token(token_data.refresh_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    if not await is_token_valid(redis_client, username, token_data.refresh_token, "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    # Revoke all old tokens and issue new pair
    await revoke_all_user_tokens(redis_client, username)

    new_token_data = {"sub": username}
    access_token = create_access_token(new_token_data)
    refresh_token = create_refresh_token(new_token_data)

    await store_token(
        redis_client, username, access_token,
        "access", settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    )
    await store_token(
        redis_client, username, refresh_token,
        "refresh", settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES,
    )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    redis_client: aioredis.Redis = Depends(get_redis),
):
    """Logout user by revoking all their tokens."""
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    username = payload.get("sub")
    if username:
        await revoke_all_user_tokens(redis_client, username)

    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserResponse(
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        is_active=current_user["is_active"],
    )
