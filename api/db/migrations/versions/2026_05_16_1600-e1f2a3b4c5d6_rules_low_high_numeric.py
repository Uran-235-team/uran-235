"""rules low/high numeric

Revision ID: e1f2a3b4c5d6
Revises: c7d8e9f0a1b2
Create Date: 2026-05-16 16:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "c7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "rules",
        "low",
        existing_type=sa.Integer(),
        type_=sa.Numeric(18, 8),
        existing_nullable=False,
    )
    op.alter_column(
        "rules",
        "high",
        existing_type=sa.Integer(),
        type_=sa.Numeric(18, 8),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "rules",
        "high",
        existing_type=sa.Numeric(18, 8),
        type_=sa.Integer(),
        existing_nullable=False,
        postgresql_using="round(high)::integer",
    )
    op.alter_column(
        "rules",
        "low",
        existing_type=sa.Numeric(18, 8),
        type_=sa.Integer(),
        existing_nullable=False,
        postgresql_using="round(low)::integer",
    )
