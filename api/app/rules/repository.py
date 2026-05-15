from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.rule import Rule


async def list_rules_for_user(session: AsyncSession, user_id: int) -> list[Rule]:
    result = await session.execute(
        select(Rule).where(Rule.user_id == user_id).order_by(Rule.id)
    )
    return list(result.scalars().all())


async def get_rule_for_user(
    session: AsyncSession, user_id: int, rule_id: int
) -> Rule | None:
    result = await session.execute(
        select(Rule).where(Rule.id == rule_id, Rule.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def find_overlapping_rule(
    session: AsyncSession,
    user_id: int,
    low: Decimal,
    high: Decimal,
    *,
    exclude_rule_id: int | None = None,
) -> Rule | None:
    stmt = select(Rule).where(
        Rule.user_id == user_id,
        Rule.low <= high,
        Rule.high >= low,
    )
    if exclude_rule_id is not None:
        stmt = stmt.where(Rule.id != exclude_rule_id)
    result = await session.execute(stmt.limit(1))
    return result.scalar_one_or_none()


async def create_rule(
    session: AsyncSession,
    user_id: int,
    *,
    title: str,
    extra: int,
    low: Decimal,
    high: Decimal,
) -> Rule:
    rule = Rule(
        user_id=user_id,
        title=title,
        extra=extra,
        low=low,
        high=high,
    )
    session.add(rule)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise
    await session.refresh(rule)
    return rule


async def save_rule(session: AsyncSession, rule: Rule) -> Rule:
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise
    await session.refresh(rule)
    return rule


async def delete_rule(session: AsyncSession, rule: Rule) -> None:
    await session.delete(rule)
    await session.commit()
