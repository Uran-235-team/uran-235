import json
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class ExchangeDefinition(BaseModel):
    """Fixed exchange slot (technical id + display title)."""

    id: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    title: str = Field(..., min_length=1, max_length=128)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    JWT_SECRET_KEY: str = "super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    postgres_host: str = Field(default="localhost")
    postgres_port: int = Field(default=5432)
    postgres_user: str = Field(default="uran")
    postgres_password: str = Field(default="uran")
    postgres_db: str = Field(default="uran")

    exchanges_json: str = Field(default="[]", validation_alias="EXCHANGES_JSON")
    emulator_ingest_secret: str = Field(default="", validation_alias="EMULATOR_INGEST_SECRET")
    ws_auth_timeout_seconds: int = Field(default=10)

    @property
    def exchanges(self) -> tuple[ExchangeDefinition, ...]:
        try:
            raw = json.loads(self.exchanges_json)
        except json.JSONDecodeError:
            return ()
        if not isinstance(raw, list):
            return ()
        out: list[ExchangeDefinition] = []
        for item in raw:
            try:
                out.append(ExchangeDefinition.model_validate(item))
            except Exception:
                continue
        # stable order as given in JSON
        ids_seen: set[str] = set()
        unique: list[ExchangeDefinition] = []
        for ex in out:
            if ex.id in ids_seen:
                continue
            ids_seen.add(ex.id)
            unique.append(ex)
        return tuple(unique)

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
