from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean

from db.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Assuming Rule will be added later
    rules: Mapped[list["Rule"]] = relationship("Rule", back_populates="user", cascade="all, delete-orphan")
