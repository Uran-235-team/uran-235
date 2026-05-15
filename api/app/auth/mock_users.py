from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Mock users storage (in-memory, no real DB)
MOCK_USERS: dict[str, dict] = {
    "admin": {
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Admin User",
        "hashed_password": pwd_context.hash("admin123"),
        "is_active": True,
    },
    "user": {
        "username": "user",
        "email": "user@example.com",
        "full_name": "Regular User",
        "hashed_password": pwd_context.hash("user123"),
        "is_active": True,
    },
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def get_user(username: str) -> dict | None:
    """Get a user by username from mock storage."""
    return MOCK_USERS.get(username)


def create_user(username: str, email: str, full_name: str, password: str) -> dict:
    """Create a new user in mock storage."""
    user = {
        "username": username,
        "email": email,
        "full_name": full_name,
        "hashed_password": hash_password(password),
        "is_active": True,
    }
    MOCK_USERS[username] = user
    return user
