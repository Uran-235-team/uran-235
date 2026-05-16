"""rule_assignments validity date range

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-19 12:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names() -> set[str]:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return {col["name"] for col in insp.get_columns("rule_assignments")}


def _drop_index_if_exists(name: str) -> None:
    op.execute(sa.text(f'DROP INDEX IF EXISTS "{name}"'))


def upgrade() -> None:
    cols = _column_names()

    if "valid_from_day" not in cols:
        op.add_column(
            "rule_assignments",
            sa.Column("valid_from_day", sa.SmallInteger(), nullable=False, server_default="1"),
        )
        op.add_column(
            "rule_assignments",
            sa.Column("valid_from_month", sa.SmallInteger(), nullable=False, server_default="1"),
        )
        op.add_column(
            "rule_assignments",
            sa.Column("valid_to_day", sa.SmallInteger(), nullable=False, server_default="31"),
        )
        op.add_column(
            "rule_assignments",
            sa.Column("valid_to_month", sa.SmallInteger(), nullable=False, server_default="12"),
        )

    if "start_date" in cols:
        op.execute(
            sa.text(
                """
                UPDATE rule_assignments
                SET
                    valid_from_day = CAST(
                        split_part(COALESCE(NULLIF(trim(start_date), ''), '01.01'), '.', 1) AS smallint
                    ),
                    valid_from_month = CAST(
                        split_part(COALESCE(NULLIF(trim(start_date), ''), '01.01'), '.', 2) AS smallint
                    ),
                    valid_to_day = CAST(
                        split_part(COALESCE(NULLIF(trim(end_date), ''), '31.12'), '.', 1) AS smallint
                    ),
                    valid_to_month = CAST(
                        split_part(COALESCE(NULLIF(trim(end_date), ''), '31.12'), '.', 2) AS smallint
                    )
                """
            )
        )
        op.drop_constraint("ck_rule_assignments_start_date_len", "rule_assignments", type_="check")
        op.drop_constraint("ck_rule_assignments_end_date_len", "rule_assignments", type_="check")
        op.drop_column("rule_assignments", "start_date")
        op.drop_column("rule_assignments", "end_date")

    _drop_index_if_exists("uq_rule_assignments_user_default")
    _drop_index_if_exists("uq_rule_assignments_user_any_exchange_currency")
    _drop_index_if_exists("uq_rule_assignments_user_exchange_any_currency")
    _drop_index_if_exists("uq_rule_assignments_user_exchange_currency")

    bind = op.get_bind()
    insp = sa.inspect(bind)
    checks = {c["name"] for c in insp.get_check_constraints("rule_assignments")}

    if "ck_rule_assignments_valid_from_month" not in checks:
        op.create_check_constraint(
            "ck_rule_assignments_valid_from_month",
            "rule_assignments",
            "valid_from_month BETWEEN 1 AND 12",
        )
    if "ck_rule_assignments_valid_to_month" not in checks:
        op.create_check_constraint(
            "ck_rule_assignments_valid_to_month",
            "rule_assignments",
            "valid_to_month BETWEEN 1 AND 12",
        )
    if "ck_rule_assignments_valid_from_day" not in checks:
        op.create_check_constraint(
            "ck_rule_assignments_valid_from_day",
            "rule_assignments",
            "valid_from_day BETWEEN 1 AND 31",
        )
    if "ck_rule_assignments_valid_to_day" not in checks:
        op.create_check_constraint(
            "ck_rule_assignments_valid_to_day",
            "rule_assignments",
            "valid_to_day BETWEEN 1 AND 31",
        )

    op.alter_column("rule_assignments", "valid_from_day", server_default=None)
    op.alter_column("rule_assignments", "valid_from_month", server_default=None)
    op.alter_column("rule_assignments", "valid_to_day", server_default=None)
    op.alter_column("rule_assignments", "valid_to_month", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_rule_assignments_valid_to_day", "rule_assignments", type_="check")
    op.drop_constraint("ck_rule_assignments_valid_from_day", "rule_assignments", type_="check")
    op.drop_constraint("ck_rule_assignments_valid_to_month", "rule_assignments", type_="check")
    op.drop_constraint("ck_rule_assignments_valid_from_month", "rule_assignments", type_="check")

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

    op.add_column(
        "rule_assignments",
        sa.Column("start_date", sa.String(length=5), nullable=True),
    )
    op.add_column(
        "rule_assignments",
        sa.Column("end_date", sa.String(length=5), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE rule_assignments
            SET
                start_date = lpad(valid_from_day::text, 2, '0')
                    || '.' || lpad(valid_from_month::text, 2, '0'),
                end_date = lpad(valid_to_day::text, 2, '0')
                    || '.' || lpad(valid_to_month::text, 2, '0')
            """
        )
    )
    op.drop_column("rule_assignments", "valid_to_month")
    op.drop_column("rule_assignments", "valid_to_day")
    op.drop_column("rule_assignments", "valid_from_month")
    op.drop_column("rule_assignments", "valid_from_day")
