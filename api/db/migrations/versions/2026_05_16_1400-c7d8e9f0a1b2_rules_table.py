"""rules table

Revision ID: c7d8e9f0a1b2
Revises: b1c2d3e4f5a6
Create Date: 2026-05-16 14:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rules",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(length=64), nullable=False),
        sa.Column("extra", sa.Integer(), nullable=False),
        sa.Column("low", sa.Integer(), nullable=False),
        sa.Column("high", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("extra > 0", name="ck_rules_extra_positive"),
        sa.CheckConstraint("low > 0", name="ck_rules_low_positive"),
        sa.CheckConstraint("high > 0", name="ck_rules_high_positive"),
        sa.CheckConstraint("high > low", name="ck_rules_high_gt_low"),
        sa.UniqueConstraint("user_id", "title", name="uq_rules_user_id_title"),
    )
    op.create_index(op.f("ix_rules_user_id"), "rules", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_rules_user_id"), table_name="rules")
    op.drop_table("rules")
