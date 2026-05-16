"""rule_sets and rule_set_rules junction

Revision ID: f7e8d9c0b1a2
Revises: e1f2a3b4c5d6
Create Date: 2026-05-17 12:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7e8d9c0b1a2"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rule_sets",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "title", name="uq_rule_sets_user_id_title"),
    )
    op.create_index(op.f("ix_rule_sets_user_id"), "rule_sets", ["user_id"], unique=False)

    op.create_table(
        "rule_set_rules",
        sa.Column("rule_set_id", sa.BigInteger(), nullable=False),
        sa.Column("rule_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(["rule_id"], ["rules.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rule_set_id"], ["rule_sets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("rule_set_id", "rule_id"),
    )


def downgrade() -> None:
    op.drop_table("rule_set_rules")
    op.drop_index(op.f("ix_rule_sets_user_id"), table_name="rule_sets")
    op.drop_table("rule_sets")
