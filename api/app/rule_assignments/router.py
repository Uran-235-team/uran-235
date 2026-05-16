from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.rule_assignments import repository
from app.rule_assignments.schemas import (
    RuleAssignmentCreate,
    RuleAssignmentResponse,
    RuleAssignmentUpdate,
)
from db.models.user import User
from db.session import get_session

router = APIRouter(prefix="/rule-assignments", tags=["Rule assignments"])

_CONFLICT_DETAIL = (
    "An assignment for this (exchange, currency) pair already exists "
    "(NULL is treated as 'any')"
)


@router.get("", response_model=list[RuleAssignmentResponse])
async def list_assignments(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await repository.list_for_user(session, current_user.id)


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

    try:
        return await repository.create(
            session,
            current_user.id,
            exchange_id=body.exchange_id,
            currency=body.currency,
            rule_set_id=body.rule_set_id,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_CONFLICT_DETAIL,
        ) from None


@router.get("/{assignment_id}", response_model=RuleAssignmentResponse)
async def get_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    assignment = await repository.get_for_user(session, current_user.id, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment


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

    if not await repository.rule_set_belongs_to_user(
        session, current_user.id, body.rule_set_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule set not found")

    assignment.rule_set_id = body.rule_set_id
    return await repository.save(session, assignment)


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
