from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.rule_assignments.dates import parse_dd_mm
from db.models.rule_assignment import RuleAssignment
from db.models.rule_set import RuleSet


async def list_for_user(session: AsyncSession, user_id: int) -> list[RuleAssignment]:
    result = await session.execute(
        select(RuleAssignment)
        .where(RuleAssignment.user_id == user_id)
        .order_by(RuleAssignment.id)
    )
    return list(result.scalars().all())


async def get_for_user(
    session: AsyncSession, user_id: int, assignment_id: int
) -> RuleAssignment | None:
    result = await session.execute(
        select(RuleAssignment).where(
            RuleAssignment.id == assignment_id,
            RuleAssignment.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def create(
    session: AsyncSession,
    user_id: int,
    *,
    exchange_id: str | None,
    currency: str | None,
    rule_set_id: int,
    valid_from: str,
    valid_to: str,
) -> RuleAssignment:
    from_day, from_month = parse_dd_mm(valid_from)
    to_day, to_month = parse_dd_mm(valid_to)
    assignment = RuleAssignment(
        user_id=user_id,
        exchange_id=exchange_id,
        currency=currency,
        rule_set_id=rule_set_id,
        valid_from_day=from_day,
        valid_from_month=from_month,
        valid_to_day=to_day,
        valid_to_month=to_month,
    )
    session.add(assignment)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise
    await session.refresh(assignment)
    return assignment


async def save(session: AsyncSession, assignment: RuleAssignment) -> RuleAssignment:
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise
    await session.refresh(assignment)
    return assignment


async def delete(session: AsyncSession, assignment: RuleAssignment) -> None:
    await session.delete(assignment)
    await session.commit()


async def rule_set_belongs_to_user(
    session: AsyncSession, user_id: int, rule_set_id: int
) -> bool:
    result = await session.execute(
        select(RuleSet.id).where(RuleSet.id == rule_set_id, RuleSet.user_id == user_id)
    )
    return result.scalar_one_or_none() is not None


async def list_for_user_with_rules(
    session: AsyncSession, user_id: int
) -> list[RuleAssignment]:
    result = await session.execute(
        select(RuleAssignment)
        .where(RuleAssignment.user_id == user_id)
        .options(selectinload(RuleAssignment.rule_set).selectinload(RuleSet.rules))
    )
    return list(result.scalars().all())
