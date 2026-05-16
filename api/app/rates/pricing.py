from decimal import Decimal, InvalidOperation
from typing import Any

from app.rule_assignments.resolver import resolve_assignment
from db.models.rule import Rule
from db.models.rule_assignment import RuleAssignment

_QUANT = Decimal("0.0001")


def _to_decimal(value: Any) -> Decimal | None:
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _pick_rule(rules: list[Rule], raw: Decimal) -> Rule | None:
    for rule in rules:
        if rule.low <= raw <= rule.high:
            return rule
    return None


def _apply(raw: Decimal, extra_pct: int) -> tuple[Decimal, Decimal]:
    multiplier = (Decimal(100) + Decimal(extra_pct)) / Decimal(100)
    final = (raw * multiplier).quantize(_QUANT)
    markup = (final - raw).quantize(_QUANT)
    return final, markup


def apply_assignments(
    *,
    exchange_id: str,
    latest_rates: dict[str, Any],
    assignments: list[RuleAssignment],
) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for currency, raw_value in latest_rates.items():
        raw = _to_decimal(raw_value)
        if raw is None:
            continue

        assignment = resolve_assignment(assignments, exchange_id, currency)
        if assignment is None:
            continue

        rule = _pick_rule(list(assignment.rule_set.rules), raw)
        if rule is None:
            out[currency] = {
                "raw": raw,
                "final": raw,
                "markup": Decimal(0),
                "matched": False,
                "rule_set_id": assignment.rule_set_id,
                "rule_id": None,
                "extra_pct": None,
            }
            continue

        final, markup = _apply(raw, rule.extra)
        out[currency] = {
            "raw": raw,
            "final": final,
            "markup": markup,
            "matched": True,
            "rule_set_id": assignment.rule_set_id,
            "rule_id": rule.id,
            "extra_pct": rule.extra,
        }

    return out
