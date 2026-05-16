from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.config import settings
from app.rates.router import router as rates_router
from app.rule_assignments.router import router as rule_assignments_router
from app.rule_sets.router import router as rule_sets_router
from app.rules.router import router as rules_router
from app.redis_client import redis_client
from db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.ping()
    async with engine.connect():
        pass
    yield
    await redis_client.close()


app = FastAPI(
    title="Uran-235 API",
    description="API with JWT authentication, PostgreSQL users, and Redis token storage",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(rates_router, prefix="/api/v1")
app.include_router(rules_router, prefix="/api/v1")
app.include_router(rule_sets_router, prefix="/api/v1")
app.include_router(rule_assignments_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
