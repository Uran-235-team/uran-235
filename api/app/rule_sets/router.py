from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.rule_sets import repository as rule_sets_repository
from app.rule_sets.schemas import LinkRuleBody, RuleSetCreate, RuleSetResponse, RuleSetUpdate
from app.rules import repository as rules_repository
from app.rules.schemas import RuleResponse
from db.models.user import User
from db.session import get_session

router = APIRouter(prefix="/rule-sets", tags=["Rule sets"])


@router.get("", response_model=list[RuleSetResponse])
async def list_rule_sets(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await rule_sets_repository.list_rule_sets_for_user(session, current_user.id)


@router.post("", response_model=RuleSetResponse, status_code=status.HTTP_201_CREATED)
async def create_rule_set(
    body: RuleSetCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        return await rule_sets_repository.create_rule_set(
            session, current_user.id, title=body.title
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rule set with this title already exists",
        ) from None


@router.get("/{rule_set_id}", response_model=RuleSetResponse)
async def get_rule_set(
    rule_set_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rs = await rule_sets_repository.get_rule_set_for_user(
        session, current_user.id, rule_set_id
    )
    if rs is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule set not found")
    return rs


@router.patch("/{rule_set_id}", response_model=RuleSetResponse)
async def update_rule_set(
    rule_set_id: int,
    body: RuleSetUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rs = await rule_sets_repository.get_rule_set_for_user(
        session, current_user.id, rule_set_id
    )
    if rs is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule set not found")
    if body.title is not None:
        rs.title = body.title
    try:
        return await rule_sets_repository.save_rule_set(session, rs)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rule set with this title already exists",
        ) from None


@router.delete("/{rule_set_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule_set(
    rule_set_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rs = await rule_sets_repository.get_rule_set_for_user(
        session, current_user.id, rule_set_id
    )
    if rs is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule set not found")
    await rule_sets_repository.delete_rule_set(session, rs)


@router.get("/{rule_set_id}/rules", response_model=list[RuleResponse])
async def list_rules_in_rule_set(
    rule_set_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rules = await rule_sets_repository.list_rules_in_rule_set(
        session, current_user.id, rule_set_id
    )
    if rules is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule set not found")
    return rules


@router.post(
    "/{rule_set_id}/rules",
    response_model=RuleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def link_rule_to_rule_set(
    rule_set_id: int,
    body: LinkRuleBody,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rule_set = await rule_sets_repository.get_rule_set_for_user(
        session, current_user.id, rule_set_id
    )
    if rule_set is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule set not found")

    rule = await rules_repository.get_rule_for_user(
        session, current_user.id, body.rule_id
    )
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

    try:
        await rule_sets_repository.link_rule_to_set(
            session, rule_set=rule_set, rule=rule
        )
    except ValueError as exc:
        code = str(exc)
        if code == "user_mismatch":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rule and rule set must belong to the same user",
            ) from None
        if code == "already_linked":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Rule is already linked to this rule set",
            ) from None
        if code == "overlap":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Price range overlaps another rule in this rule set",
            ) from None
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot link rule",
        ) from exc
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Rule is already linked to this rule set",
        ) from None

    await session.refresh(rule)
    return rule


@router.delete(
    "/{rule_set_id}/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def unlink_rule_from_rule_set(
    rule_set_id: int,
    rule_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rs = await rule_sets_repository.get_rule_set_for_user(
        session, current_user.id, rule_set_id
    )
    if rs is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule set not found")

    rule = await rules_repository.get_rule_for_user(session, current_user.id, rule_id)
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

    removed = await rule_sets_repository.unlink_rule_from_set(
        session, rule_set_id=rule_set_id, rule_id=rule_id
    )
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule is not linked to this rule set",
        )
