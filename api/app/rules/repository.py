from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.rule import Rule
from db.models.rule_set import RuleSet, rule_set_rules


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
    res = await session.execute(
        select(rule_set_rules.c.rule_set_id).where(rule_set_rules.c.rule_id == rule.id)
    )
    affected_set_ids = list(res.scalars().all())

    await session.delete(rule)
    await session.flush()

    if affected_set_ids:
        remaining = await session.execute(
            select(rule_set_rules.c.rule_set_id)
            .where(rule_set_rules.c.rule_set_id.in_(affected_set_ids))
            .distinct()
        )
        non_empty = set(remaining.scalars().all())
        empty_ids = [sid for sid in affected_set_ids if sid not in non_empty]
        if empty_ids:
            await session.execute(delete(RuleSet).where(RuleSet.id.in_(empty_ids)))

    await session.commit()
