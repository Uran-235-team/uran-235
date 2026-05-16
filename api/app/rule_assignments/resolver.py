from datetime import date

from app.rule_assignments.schemas import assignment_is_active
from db.models.rule_assignment import RuleAssignment


def resolve_assignment(
    assignments: list[RuleAssignment],
    exchange_id: str,
    currency: str,
    *,
    as_of: date,
) -> RuleAssignment | None:
    active = [a for a in assignments if assignment_is_active(a, as_of)]

    exact: RuleAssignment | None = None
    by_exchange: RuleAssignment | None = None
    by_currency: RuleAssignment | None = None
    default: RuleAssignment | None = None

    for a in active:
        if a.exchange_id is not None and a.currency is not None:
            if a.exchange_id == exchange_id and a.currency == currency:
                exact = a
        elif a.exchange_id is not None and a.currency is None:
            if a.exchange_id == exchange_id:
                by_exchange = a
        elif a.exchange_id is None and a.currency is not None:
            if a.currency == currency:
                by_currency = a
        else:
            default = a

    return exact or by_exchange or by_currency or default
