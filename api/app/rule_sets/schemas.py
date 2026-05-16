from pydantic import BaseModel, ConfigDict, Field


class RuleSetCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=64)


class RuleSetUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=64)


class RuleSetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str


class LinkRuleBody(BaseModel):
    rule_id: int = Field(..., gt=0)
