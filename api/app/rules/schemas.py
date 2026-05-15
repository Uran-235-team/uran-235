from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=64)
    extra: int = Field(..., gt=0)
    low: Decimal = Field(..., gt=0)
    high: Decimal = Field(..., gt=0)

    @model_validator(mode="after")
    def high_gt_low(self):
        if self.high <= self.low:
            raise ValueError("high must be greater than low")
        return self


class RuleUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=64)
    extra: int | None = Field(None, gt=0)
    low: Decimal | None = Field(None, gt=0)
    high: Decimal | None = Field(None, gt=0)

    @model_validator(mode="after")
    def validate_pair(self):
        if self.low is not None and self.high is not None and self.high <= self.low:
            raise ValueError("high must be greater than low")
        return self


class RuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    extra: int
    low: Decimal
    high: Decimal
