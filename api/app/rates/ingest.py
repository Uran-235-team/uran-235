from datetime import date, datetime, timezone
from typing import Any


def parse_observed_at(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        if text.endswith("Z"):
            text = f"{text[:-1]}+00:00"
        try:
            parsed = datetime.fromisoformat(text)
        except ValueError:
            return None
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    return None


def normalize_emulator_payload(payload: dict[str, Any]) -> tuple[dict[str, Any], datetime | None]:
    """Accept {rates, observed_at?} or a legacy flat currency->rate map."""
    observed_at = parse_observed_at(payload.get("observed_at"))
    rates_obj = payload.get("rates")
    if isinstance(rates_obj, dict):
        return rates_obj, observed_at

    rates: dict[str, Any] = {}
    for key, value in payload.items():
        if key in {"observed_at", "timestamp", "as_of"}:
            if observed_at is None:
                observed_at = parse_observed_at(value)
            continue
        rates[key] = value
    return rates, observed_at


def observed_as_date(observed_at: datetime | None) -> date:
    if observed_at is None:
        return datetime.now(timezone.utc).date()
    return observed_at.astimezone(timezone.utc).date()
