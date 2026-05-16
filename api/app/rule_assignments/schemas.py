import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

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


class RuleAssignmentCreate(BaseModel):
    exchange_id: str | None = Field(default=None, description="null = any exchange")
    currency: str | None = Field(default=None, description="null = any currency")
    rule_set_id: int = Field(..., gt=0)

    @field_validator("exchange_id", mode="before")
    @classmethod
    def _exchange_id(cls, v):
        return _normalize_exchange(v)

    @field_validator("currency", mode="before")
    @classmethod
    def _currency(cls, v):
        return _normalize_currency(v)


class RuleAssignmentUpdate(BaseModel):
    rule_set_id: int = Field(..., gt=0)


class RuleAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exchange_id: str | None
    currency: str | None
    rule_set_id: int
