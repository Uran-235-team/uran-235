from decimal import Decimal

from sqlalchemy import delete, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from db.models.rule import Rule
from db.models.rule_set import RuleSet, rule_set_rules


async def find_overlapping_rule_in_set(
    session: AsyncSession,
    rule_set_id: int,
    low: Decimal,
    high: Decimal,
    *,
    exclude_rule_id: int | None = None,
) -> Rule | None:
    """Closed intervals [low, high] overlap iff existing.low <= high AND existing.high >= low."""
    stmt = (
        select(Rule)
        .join(rule_set_rules, Rule.id == rule_set_rules.c.rule_id)
        .where(
            rule_set_rules.c.rule_set_id == rule_set_id,
            Rule.low <= high,
            Rule.high >= low,
        )
    )
    if exclude_rule_id is not None:
        stmt = stmt.where(Rule.id != exclude_rule_id)
    result = await session.execute(stmt.limit(1))
    return result.scalar_one_or_none()


async def rule_interval_conflicts_in_any_linked_set(
    session: AsyncSession,
    rule_id: int,
    low: Decimal,
    high: Decimal,
) -> Rule | None:
    """Variant A: bounds change must stay non-overlapping in every rule set that contains this rule."""
    res = await session.execute(
        select(rule_set_rules.c.rule_set_id).where(rule_set_rules.c.rule_id == rule_id)
    )
    for rule_set_id in res.scalars().all():
        conflict = await find_overlapping_rule_in_set(
            session,
            rule_set_id,
            low,
            high,
            exclude_rule_id=rule_id,
        )
        if conflict is not None:
            return conflict
    return None


async def list_rule_sets_for_user(session: AsyncSession, user_id: int) -> list[RuleSet]:
    result = await session.execute(
        select(RuleSet).where(RuleSet.user_id == user_id).order_by(RuleSet.id)
    )
    return list(result.scalars().all())


async def get_rule_set_for_user(
    session: AsyncSession, user_id: int, rule_set_id: int
) -> RuleSet | None:
    result = await session.execute(
        select(RuleSet).where(RuleSet.id == rule_set_id, RuleSet.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_rule_set(session: AsyncSession, user_id: int, *, title: str) -> RuleSet:
    rs = RuleSet(user_id=user_id, title=title)
    session.add(rs)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise
    await session.refresh(rs)
    return rs


async def save_rule_set(session: AsyncSession, rule_set: RuleSet) -> RuleSet:
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise
    await session.refresh(rule_set)
    return rule_set


async def delete_rule_set(session: AsyncSession, rule_set: RuleSet) -> None:
    await session.delete(rule_set)
    await session.commit()


async def list_rules_in_rule_set(
    session: AsyncSession, user_id: int, rule_set_id: int
) -> list[Rule] | None:
    rs = await get_rule_set_for_user(session, user_id, rule_set_id)
    if rs is None:
        return None
    stmt = (
        select(Rule)
        .join(rule_set_rules, Rule.id == rule_set_rules.c.rule_id)
        .where(rule_set_rules.c.rule_set_id == rule_set_id)
        .order_by(Rule.id)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def is_rule_linked_to_set(
    session: AsyncSession, rule_set_id: int, rule_id: int
) -> bool:
    res = await session.execute(
        select(rule_set_rules.c.rule_id).where(
            rule_set_rules.c.rule_set_id == rule_set_id,
            rule_set_rules.c.rule_id == rule_id,
        )
    )
    return res.scalar_one_or_none() is not None


async def link_rule_to_set(
    session: AsyncSession,
    *,
    rule_set: RuleSet,
    rule: Rule,
) -> None:
    if rule.user_id != rule_set.user_id:
        raise ValueError("user_mismatch")

    if await is_rule_linked_to_set(session, rule_set.id, rule.id):
        raise ValueError("already_linked")

    overlap = await find_overlapping_rule_in_set(
        session,
        rule_set.id,
        rule.low,
        rule.high,
    )
    if overlap is not None:
        raise ValueError("overlap")

    await session.execute(
        insert(rule_set_rules).values(rule_set_id=rule_set.id, rule_id=rule.id)
    )
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise


async def unlink_rule_from_set(
    session: AsyncSession, *, rule_set_id: int, rule_id: int
) -> bool:
    result = await session.execute(
        delete(rule_set_rules).where(
            rule_set_rules.c.rule_set_id == rule_set_id,
            rule_set_rules.c.rule_id == rule_id,
        )
    )
    await session.commit()
    return (result.rowcount or 0) > 0
