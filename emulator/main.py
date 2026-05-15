import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
from emulator import rates, start_emulator, TICK_RATE


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_emulator()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/api/rates")
async def get_rates():
    return rates


@app.websocket("/ws/rates")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(rates)
            await asyncio.sleep(TICK_RATE)
    except WebSocketDisconnect:
        pass
