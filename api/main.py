from fastapi import FastAPI

app = FastAPI(title="uran-235 api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
