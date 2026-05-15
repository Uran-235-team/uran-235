from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.auth.router import router as auth_router
from app.rates.hub import rates_hub
from app.rates.router import router as rates_router
from app.redis_client import redis_client
from db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.ping()
    async with engine.connect():
        pass
    await rates_hub.start()
    yield
    await rates_hub.stop()
    await redis_client.close()


app = FastAPI(
    title="Uran-235 API",
    description="API with JWT authentication, PostgreSQL users, and Redis token storage",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(rates_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
