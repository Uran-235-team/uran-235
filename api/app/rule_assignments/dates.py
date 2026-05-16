import calendar
import re
from datetime import date

_DD_MM_RE = re.compile(r"^(\d{1,2})\.(\d{1,2})$")


def parse_dd_mm(value: str) -> tuple[int, int]:
    """Parse DD.MM (day.month, recurring yearly) into (day, month)."""
    value = value.strip()
    m = _DD_MM_RE.fullmatch(value)
    if not m:
        raise ValueError("date must be in DD.MM format")
    day = int(m.group(1))
    month = int(m.group(2))
    if not 1 <= month <= 12:
        raise ValueError("month must be between 1 and 12")
    max_day = calendar.monthrange(2000, month)[1]
    if not 1 <= day <= max_day:
        raise ValueError(f"day must be between 1 and {max_day} for month {month}")
    return day, month


def format_dd_mm(day: int, month: int) -> str:
    return f"{day:02d}.{month:02d}"


def day_of_year(day: int, month: int) -> int:
    return date(2000, month, day).timetuple().tm_yday


def is_active_on(
    as_of: date,
    *,
    from_day: int,
    from_month: int,
    to_day: int,
    to_month: int,
) -> bool:
    """True if calendar day (month/day, any year) falls in [from, to], inclusive."""
    doy = day_of_year(as_of.day, as_of.month)
    start = day_of_year(from_day, from_month)
    end = day_of_year(to_day, to_month)
    if start <= end:
        return start <= doy <= end
    return doy >= start or doy <= end
