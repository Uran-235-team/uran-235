from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.rule_sets import repository as rule_sets_repository
from app.rules import repository as rules_repository
from app.rules.schemas import RuleCreate, RuleResponse, RuleUpdate
from db.models.user import User
from db.session import get_session

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get("", response_model=list[RuleResponse])
async def list_rules(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await rules_repository.list_rules_for_user(session, current_user.id)


@router.post("", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    body: RuleCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await rules_repository.create_rule(
            session,
            current_user.id,
            title=body.title,
            extra=body.extra,
            low=body.low,
            high=body.high,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rule with this title already exists",
        ) from None


@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rule = await rules_repository.get_rule_for_user(session, current_user.id, rule_id)
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return rule


@router.patch("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: int,
    body: RuleUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rule = await rules_repository.get_rule_for_user(session, current_user.id, rule_id)
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

    if body.title is not None:
        rule.title = body.title
    if body.extra is not None:
        rule.extra = body.extra
    if body.low is not None:
        rule.low = body.low
    if body.high is not None:
        rule.high = body.high

    low, high = rule.low, rule.high
    if low <= 0 or high <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="low and high must be positive",
        )
    if high <= low:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="high must be greater than low",
        )

    if body.low is not None or body.high is not None:
        conflict = await rule_sets_repository.rule_interval_conflicts_in_any_linked_set(
            session,
            rule.id,
            low,
            high,
        )
        if conflict is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Price range overlaps another rule in a linked rule set",
            )

    try:
        return await rules_repository.save_rule(session, rule)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rule with this title already exists",
        ) from None


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rule = await rules_repository.get_rule_for_user(session, current_user.id, rule_id)
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    await rules_repository.delete_rule(session, rule)
