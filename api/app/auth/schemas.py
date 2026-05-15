from pydantic import BaseModel


class UserLogin(BaseModel):
    """Schema for login request."""
    username: str
    password: str


class UserRegister(BaseModel):
    """Schema for registration request."""
    username: str
    email: str
    full_name: str
    password: str


class TokenResponse(BaseModel):
    """Schema for token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str


class UserResponse(BaseModel):
    """Schema for user info response."""
    username: str
    email: str
    full_name: str
    is_active: bool


class MessageResponse(BaseModel):
    """Schema for simple message response."""
    message: str
