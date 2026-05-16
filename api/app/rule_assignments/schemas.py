import re

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.rule_assignments.dates import format_dd_mm, is_active_on, parse_dd_mm

_EXCHANGE_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
_CURRENCY_RE = re.compile(r"^[A-Z0-9]{1,16}$")


def _normalize_exchange(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    if not _EXCHANGE_ID_RE.fullmatch(value):
        raise ValueError("exchange_id must match [a-zA-Z0-9_-]{1,64}")
    return value


def _normalize_currency(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip().upper()
    if not value:
        return None
    if not _CURRENCY_RE.fullmatch(value):
        raise ValueError("currency must be uppercase A-Z/0-9, 1..16 chars")
    return value


def _parse_validity_pair(valid_from: str, valid_to: str) -> tuple[int, int, int, int]:
    from_day, from_month = parse_dd_mm(valid_from)
    to_day, to_month = parse_dd_mm(valid_to)
    return from_day, from_month, to_day, to_month


class RuleAssignmentCreate(BaseModel):
    exchange_id: str | None = Field(default=None, description="null = any exchange")
    currency: str | None = Field(default=None, description="null = any currency")
    rule_set_id: int = Field(..., gt=0)
    valid_from: str = Field(..., description="Start of validity (DD.MM, recurring yearly)")
    valid_to: str = Field(..., description="End of validity (DD.MM, recurring yearly)")

    @field_validator("exchange_id", mode="before")
    @classmethod
    def _exchange_id(cls, v):
        return _normalize_exchange(v)

    @field_validator("currency", mode="before")
    @classmethod
    def _currency(cls, v):
        return _normalize_currency(v)

    @field_validator("valid_from", "valid_to", mode="before")
    @classmethod
    def _strip_dates(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @model_validator(mode="after")
    def _dates(self):
        _parse_validity_pair(self.valid_from, self.valid_to)
        return self


class RuleAssignmentUpdate(BaseModel):
    rule_set_id: int | None = Field(default=None, gt=0)
    valid_from: str | None = Field(default=None, description="DD.MM")
    valid_to: str | None = Field(default=None, description="DD.MM")

    @field_validator("valid_from", "valid_to", mode="before")
    @classmethod
    def _strip_dates(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @model_validator(mode="after")
    def _require_change(self):
        if self.rule_set_id is None and self.valid_from is None and self.valid_to is None:
            raise ValueError("at least one field must be provided")
        if (self.valid_from is None) != (self.valid_to is None):
            raise ValueError("valid_from and valid_to must be updated together")
        if self.valid_from is not None and self.valid_to is not None:
            _parse_validity_pair(self.valid_from, self.valid_to)
        return self


class RuleAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exchange_id: str | None
    currency: str | None
    rule_set_id: int
    valid_from: str
    valid_to: str

    @classmethod
    def from_model(cls, assignment) -> "RuleAssignmentResponse":
        return cls(
            id=assignment.id,
            exchange_id=assignment.exchange_id,
            currency=assignment.currency,
            rule_set_id=assignment.rule_set_id,
            valid_from=format_dd_mm(assignment.valid_from_day, assignment.valid_from_month),
            valid_to=format_dd_mm(assignment.valid_to_day, assignment.valid_to_month),
        )


def assignment_is_active(assignment, as_of) -> bool:
    return is_active_on(
        as_of,
        from_day=assignment.valid_from_day,
        from_month=assignment.valid_from_month,
        to_day=assignment.valid_to_day,
        to_month=assignment.valid_to_month,
    )
