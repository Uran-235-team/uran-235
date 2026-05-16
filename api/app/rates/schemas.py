from pydantic import BaseModel, Field


class ExchangePublic(BaseModel):
    id: str = Field(..., description="Technical exchange id (same as query exchange_id for WS)")
    title: str = Field(..., description="Display name for clients")
    online: bool = Field(..., description="Whether an emulator is currently feeding this exchange")
