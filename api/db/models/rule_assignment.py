from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from db.models.rule_set import RuleSet
    from db.models.user import User


class RuleAssignment(Base):
    __tablename__ = "rule_assignments"
    __table_args__ = (
        CheckConstraint(
            "exchange_id IS NULL OR length(exchange_id) BETWEEN 1 AND 64",
            name="ck_rule_assignments_exchange_id_len",
        ),
        CheckConstraint(
            "currency IS NULL OR length(currency) BETWEEN 1 AND 16",
            name="ck_rule_assignments_currency_len",
        ),
        Index(
            "uq_rule_assignments_user_exchange_currency",
            "user_id",
            "exchange_id",
            "currency",
            unique=True,
            postgresql_where="exchange_id IS NOT NULL AND currency IS NOT NULL",
        ),
        Index(
            "uq_rule_assignments_user_exchange_any_currency",
            "user_id",
            "exchange_id",
            unique=True,
            postgresql_where="exchange_id IS NOT NULL AND currency IS NULL",
        ),
        Index(
            "uq_rule_assignments_user_any_exchange_currency",
            "user_id",
            "currency",
            unique=True,
            postgresql_where="exchange_id IS NULL AND currency IS NOT NULL",
        ),
        Index(
            "uq_rule_assignments_user_default",
            "user_id",
            unique=True,
            postgresql_where="exchange_id IS NULL AND currency IS NULL",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exchange_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(16), nullable=True)
    rule_set_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("rule_sets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user: Mapped["User"] = relationship(back_populates="rule_assignments")
    rule_set: Mapped["RuleSet"] = relationship(back_populates="assignments")
