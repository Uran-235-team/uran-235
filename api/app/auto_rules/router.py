import logging
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.ml import predictor
from app.rates.hub import hub_manager
from db.models.rule import Rule
from db.models.rule_assignment import RuleAssignment
from db.models.rule_set import RuleSet, rule_set_rules
from db.models.user import User
from db.session import get_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auto-rules", tags=["Auto rules"])

_HIGH_QUANT = Decimal("0.00000001")
_LOW_BOUND = Decimal("1")
_HIGH_MULTIPLIER = Decimal("10")


class AutoGenerateResponse(BaseModel):
    deleted_rules: int
    deleted_rule_sets: int
    deleted_assignments: int
    created_rules: int
    skipped_currencies: int
    exchanges: int


def _collect_snapshots() -> list[tuple[str, str, Decimal]]:
    snapshots: list[tuple[str, str, Decimal]] = []
    for exchange_id, _title in hub_manager.list_exchanges():
        hub = hub_manager.get_hub(exchange_id)
        if hub is None:
            continue
        for currency, raw_value in hub.latest_rates.items():
            try:
                price = Decimal(str(raw_value))
            except (InvalidOperation, ValueError, TypeError):
                continue
            if price <= 0:
                continue
            snapshots.append((exchange_id, currency, price))
    return snapshots


@router.post(
    "/generate",
    response_model=AutoGenerateResponse,
    status_code=status.HTTP_200_OK,
)
async def auto_generate(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AutoGenerateResponse:
    deleted_assignments = (
        await session.execute(
            delete(RuleAssignment).where(RuleAssignment.user_id == current_user.id)
        )
    ).rowcount or 0
    deleted_rule_sets = (
        await session.execute(delete(RuleSet).where(RuleSet.user_id == current_user.id))
    ).rowcount or 0
    deleted_rules = (
        await session.execute(delete(Rule).where(Rule.user_id == current_user.id))
    ).rowcount or 0
    await session.commit()

    snapshots = _collect_snapshots()
    exchanges_count = len({exchange_id for exchange_id, _, _ in snapshots})

    if not snapshots:
        return AutoGenerateResponse(
            deleted_rules=deleted_rules,
            deleted_rule_sets=deleted_rule_sets,
            deleted_assignments=deleted_assignments,
            created_rules=0,
            skipped_currencies=0,
            exchanges=0,
        )

    today_dd_mm = date.today().strftime("%d-%m")
    try:
        predictions = predictor.predict_batch(
            (exchange_id, float(price), today_dd_mm)
            for exchange_id, _currency, price in snapshots
        )
    except (FileNotFoundError, ModuleNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auto-rules model is unavailable",
        ) from exc
    except Exception as exc:
        logger.exception("Failed to generate auto-rules for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate auto-rules",
        ) from exc

    rules_to_create: list[Rule] = []
    rule_sets_to_create: list[RuleSet] = []
    plan: list[tuple[str, str]] = []
    skipped = 0

    for (exchange_id, currency, price), raw_pct in zip(snapshots, predictions):
        high = (price * _HIGH_MULTIPLIER).quantize(_HIGH_QUANT, rounding=ROUND_HALF_UP)
        if high <= _LOW_BOUND:
            skipped += 1
            continue

        extra = max(1, int(round(raw_pct)))
        title = f"auto-{exchange_id}-{currency}"[:64]

        rules_to_create.append(
            Rule(
                user_id=current_user.id,
                title=title,
                extra=extra,
                low=_LOW_BOUND,
                high=high,
            )
        )
        rule_sets_to_create.append(RuleSet(user_id=current_user.id, title=title))
        plan.append((exchange_id, currency))

    if not rules_to_create:
        return AutoGenerateResponse(
            deleted_rules=deleted_rules,
            deleted_rule_sets=deleted_rule_sets,
            deleted_assignments=deleted_assignments,
            created_rules=0,
            skipped_currencies=skipped,
            exchanges=exchanges_count,
        )

    session.add_all(rules_to_create)
    session.add_all(rule_sets_to_create)
    await session.flush()

    membership: list[dict[str, Any]] = [
        {"rule_set_id": rule_set.id, "rule_id": rule.id}
        for rule_set, rule in zip(rule_sets_to_create, rules_to_create)
    ]
    await session.execute(insert(rule_set_rules), membership)

    assignments = [
        RuleAssignment(
            user_id=current_user.id,
            exchange_id=exchange_id,
            currency=currency,
            rule_set_id=rule_set.id,
            valid_from_day=1,
            valid_from_month=1,
            valid_to_day=31,
            valid_to_month=12,
        )
        for (exchange_id, currency), rule_set in zip(plan, rule_sets_to_create)
    ]
    session.add_all(assignments)

    try:
        await session.commit()
    except Exception as exc:
        await session.rollback()
        logger.exception(
            "Failed to persist auto-generated rules for user %s", current_user.id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist auto-generated rules",
        ) from exc

    return AutoGenerateResponse(
        deleted_rules=deleted_rules,
        deleted_rule_sets=deleted_rule_sets,
        deleted_assignments=deleted_assignments,
        created_rules=len(rules_to_create),
        skipped_currencies=skipped,
        exchanges=exchanges_count,
    )
