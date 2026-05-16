from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, SmallInteger, String
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
        CheckConstraint(
            "valid_from_month BETWEEN 1 AND 12",
            name="ck_rule_assignments_valid_from_month",
        ),
        CheckConstraint(
            "valid_to_month BETWEEN 1 AND 12",
            name="ck_rule_assignments_valid_to_month",
        ),
        CheckConstraint(
            "valid_from_day BETWEEN 1 AND 31",
            name="ck_rule_assignments_valid_from_day",
        ),
        CheckConstraint(
            "valid_to_day BETWEEN 1 AND 31",
            name="ck_rule_assignments_valid_to_day",
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
    valid_from_day: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    valid_from_month: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    valid_to_day: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    valid_to_month: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    user: Mapped["User"] = relationship(back_populates="rule_assignments")
    rule_set: Mapped["RuleSet"] = relationship(back_populates="assignments")
