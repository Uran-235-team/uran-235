from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.auth.router import router as auth_router
from app.redis_client import redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: check Redis on startup, close on shutdown."""
    await redis_client.ping()
    yield
    await redis_client.close()


app = FastAPI(
    title="Uran-235 API",
    description="API with mock JWT Authentication and Redis token storage",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(auth_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
