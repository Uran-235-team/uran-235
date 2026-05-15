import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.security import AccessTokenError, verify_access_token
from app.config import settings
from app.rates.hub import rates_hub
from app.redis_client import redis_client
from db.session import SessionLocal

router = APIRouter(tags=["Rates"])


@router.websocket("/ws/rates")
async def rates_ws(websocket: WebSocket):
    await websocket.accept()

    try:
        raw = await asyncio.wait_for(
            websocket.receive_text(),
            timeout=settings.ws_auth_timeout_seconds,
        )
    except asyncio.TimeoutError:
        await websocket.close(code=1008, reason="Auth timeout")
        return
    except WebSocketDisconnect:
        return

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        await websocket.close(code=1008, reason="Invalid JSON")
        return

    token = payload.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return

    async with SessionLocal() as session:
        try:
            user = await verify_access_token(token, redis_client, session)
        except AccessTokenError as exc:
            await websocket.close(code=1008, reason=exc.detail)
            return

    await websocket.send_json(
        {"type": "auth", "status": "ok", "username": user.username}
    )

    if rates_hub.latest_rates:
        await websocket.send_json(rates_hub.latest_rates)

    await rates_hub.subscribe(websocket)

    try:
        while websocket.client_state == WebSocketState.CONNECTED:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await rates_hub.unsubscribe(websocket)
