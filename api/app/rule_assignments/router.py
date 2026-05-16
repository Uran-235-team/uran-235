from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.rule_assignments import repository
from app.rule_assignments.dates import parse_dd_mm
from app.rule_assignments.schemas import (
    RuleAssignmentCreate,
    RuleAssignmentResponse,
    RuleAssignmentUpdate,
)
from db.models.user import User
from db.session import get_session

router = APIRouter(prefix="/rule-assignments", tags=["Rule assignments"])


@router.get("", response_model=list[RuleAssignmentResponse])
async def list_assignments(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = await repository.list_for_user(session, current_user.id)
    return [RuleAssignmentResponse.from_model(row) for row in rows]


@router.post("", response_model=RuleAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    body: RuleAssignmentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not await repository.rule_set_belongs_to_user(
        session, current_user.id, body.rule_set_id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule set not found",
        )

    assignment = await repository.create(
        session,
        current_user.id,
        exchange_id=body.exchange_id,
        currency=body.currency,
        rule_set_id=body.rule_set_id,
        valid_from=body.valid_from,
        valid_to=body.valid_to,
    )
    return RuleAssignmentResponse.from_model(assignment)


@router.get("/{assignment_id}", response_model=RuleAssignmentResponse)
async def get_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    assignment = await repository.get_for_user(session, current_user.id, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return RuleAssignmentResponse.from_model(assignment)


@router.patch("/{assignment_id}", response_model=RuleAssignmentResponse)
async def update_assignment(
    assignment_id: int,
    body: RuleAssignmentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    assignment = await repository.get_for_user(session, current_user.id, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if body.rule_set_id is not None:
        if not await repository.rule_set_belongs_to_user(
            session, current_user.id, body.rule_set_id
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule set not found")
        assignment.rule_set_id = body.rule_set_id

    if body.valid_from is not None and body.valid_to is not None:
        from_day, from_month = parse_dd_mm(body.valid_from)
        to_day, to_month = parse_dd_mm(body.valid_to)
        assignment.valid_from_day = from_day
        assignment.valid_from_month = from_month
        assignment.valid_to_day = to_day
        assignment.valid_to_month = to_month

    return RuleAssignmentResponse.from_model(await repository.save(session, assignment))


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    assignment = await repository.get_for_user(session, current_user.id, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    await repository.delete(session, assignment)
