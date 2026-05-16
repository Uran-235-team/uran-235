"""rule_assignments table

Revision ID: a1b2c3d4e5f6
Revises: f7e8d9c0b1a2
Create Date: 2026-05-18 12:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f7e8d9c0b1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rule_assignments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("exchange_id", sa.String(length=64), nullable=True),
        sa.Column("currency", sa.String(length=16), nullable=True),
        sa.Column("rule_set_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rule_set_id"], ["rule_sets.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "exchange_id IS NULL OR length(exchange_id) BETWEEN 1 AND 64",
            name="ck_rule_assignments_exchange_id_len",
        ),
        sa.CheckConstraint(
            "currency IS NULL OR length(currency) BETWEEN 1 AND 16",
            name="ck_rule_assignments_currency_len",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_rule_assignments_user_id"),
        "rule_assignments",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rule_assignments_rule_set_id"),
        "rule_assignments",
        ["rule_set_id"],
        unique=False,
    )

    op.create_index(
        "uq_rule_assignments_user_exchange_currency",
        "rule_assignments",
        ["user_id", "exchange_id", "currency"],
        unique=True,
        postgresql_where=sa.text("exchange_id IS NOT NULL AND currency IS NOT NULL"),
    )
    op.create_index(
        "uq_rule_assignments_user_exchange_any_currency",
        "rule_assignments",
        ["user_id", "exchange_id"],
        unique=True,
        postgresql_where=sa.text("exchange_id IS NOT NULL AND currency IS NULL"),
    )
    op.create_index(
        "uq_rule_assignments_user_any_exchange_currency",
        "rule_assignments",
        ["user_id", "currency"],
        unique=True,
        postgresql_where=sa.text("exchange_id IS NULL AND currency IS NOT NULL"),
    )
    op.create_index(
        "uq_rule_assignments_user_default",
        "rule_assignments",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("exchange_id IS NULL AND currency IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_rule_assignments_user_default", table_name="rule_assignments")
    op.drop_index("uq_rule_assignments_user_any_exchange_currency", table_name="rule_assignments")
    op.drop_index("uq_rule_assignments_user_exchange_any_currency", table_name="rule_assignments")
    op.drop_index("uq_rule_assignments_user_exchange_currency", table_name="rule_assignments")
    op.drop_index(op.f("ix_rule_assignments_rule_set_id"), table_name="rule_assignments")
    op.drop_index(op.f("ix_rule_assignments_user_id"), table_name="rule_assignments")
    op.drop_table("rule_assignments")
