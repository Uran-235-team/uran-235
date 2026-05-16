from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from db.models.rule_set import rule_set_rules

if TYPE_CHECKING:
    from db.models.rule_set import RuleSet
    from db.models.user import User


class Rule(Base):
    __tablename__ = "rules"
    __table_args__ = (
        CheckConstraint("extra > 0", name="ck_rules_extra_positive"),
        CheckConstraint("low > 0", name="ck_rules_low_positive"),
        CheckConstraint("high > 0", name="ck_rules_high_positive"),
        CheckConstraint("high > low", name="ck_rules_high_gt_low"),
        UniqueConstraint("user_id", "title", name="uq_rules_user_id_title"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(64), nullable=False)
    extra: Mapped[int] = mapped_column(Integer, nullable=False)
    low: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    high: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)

    user: Mapped["User"] = relationship(back_populates="rules")
    rule_sets: Mapped[list["RuleSet"]] = relationship(
        secondary=rule_set_rules,
        back_populates="rules",
    )
