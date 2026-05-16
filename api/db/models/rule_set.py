from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String, Table, Column, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from db.models.rule import Rule
    from db.models.user import User


rule_set_rules = Table(
    "rule_set_rules",
    Base.metadata,
    Column(
        "rule_set_id",
        BigInteger,
        ForeignKey("rule_sets.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "rule_id",
        BigInteger,
        ForeignKey("rules.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class RuleSet(Base):
    __tablename__ = "rule_sets"
    __table_args__ = (UniqueConstraint("user_id", "title", name="uq_rule_sets_user_id_title"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(64), nullable=False)

    user: Mapped["User"] = relationship(back_populates="rule_sets")
    rules: Mapped[list["Rule"]] = relationship(
        secondary=rule_set_rules,
        back_populates="rule_sets",
    )
