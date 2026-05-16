from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExchangePublic(BaseModel):
    id: str = Field(..., description="Technical exchange id (same as query exchange_id for WS)")
    title: str = Field(..., description="Display name for clients")


class PricedRate(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: str})

    raw: Decimal
    final: Decimal
    markup: Decimal
    matched: bool = Field(
        ...,
        description="True iff a rule in the resolved rule set covered the raw price",
    )
    rule_set_id: int | None
    rule_id: int | None
    extra_pct: int | None


class PricedRatesResponse(BaseModel):
    exchange_id: str
    rates: dict[str, PricedRate]
