import asyncio
import json
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.config import ExchangeDefinition, settings
from app.dependencies import get_current_user
from app.rates.hub import ExchangeHub, hub_manager
from app.rates.schemas import ExchangePublic
from app.security import AccessTokenError, verify_access_token
from app.redis_client import redis_client
from db.models.user import User
from db.session import SessionLocal

logger = logging.getLogger(__name__)


def _match_exchange_handshake(exchange_id: str | None, title: str | None) -> ExchangeDefinition | None:
    if exchange_id is None or title is None:
        return None
    tid = exchange_id.strip()
    ttitle = title.strip()
    for ex in settings.exchanges:
        if ex.id == tid and ex.title.strip() == ttitle:
            return ex
    return None


@router.get("/exchanges", response_model=list[ExchangePublic])
async def list_exchanges(current_user: User = Depends(get_current_user)):
    return [
        ExchangePublic(
            id=ex.id,
            title=ex.title,
            online=hub_manager.exchange_online(ex.id),
        )
        for ex in settings.exchanges
    ]


@router.websocket("/ws/emulator")
async def emulator_ingest_ws(websocket: WebSocket):
    """Inbound connection from an emulator process (feeds one configured exchange)."""
    await websocket.accept()
    hub: ExchangeHub | None = None
    try:
        raw = await asyncio.wait_for(
            websocket.receive_text(),
            timeout=settings.ws_auth_timeout_seconds,
        )
        hello = json.loads(raw)
        if not isinstance(hello, dict):
            await websocket.close(code=1008, reason="Handshake must be a JSON object")
            return

        ex = _match_exchange_handshake(hello.get("exchange_id"), hello.get("title"))
        if ex is None:
            await websocket.close(code=1008, reason="Unknown exchange or title mismatch")
            return

        if settings.emulator_ingest_secret:
            if (hello.get("secret") or "") != settings.emulator_ingest_secret:
                await websocket.close(code=1008, reason="Invalid ingest secret")
                return

        hub = hub_manager.get_hub(ex.id)
        if hub is None:
            await websocket.close(code=1008, reason="Exchange not configured")
            return

        await hub.replace_upstream(websocket)
        logger.info("Emulator connected for exchange %s (%s)", ex.id, ex.title)

        while True:
            raw_msg = await websocket.receive_text()
            payload = json.loads(raw_msg)
            if not isinstance(payload, dict):
                await websocket.close(code=1008, reason="Rates payload must be a JSON object")
                return
            await hub.ingest_and_broadcast(payload)

    except asyncio.TimeoutError:
        await websocket.close(code=1008, reason="Handshake timeout")
    except WebSocketDisconnect:
        pass
    except json.JSONDecodeError:
        try:
            await websocket.close(code=1008, reason="Invalid JSON")
        except Exception:
            pass
    except Exception as exc:
        logger.warning("Emulator ingest error: %s", exc)
        try:
            await websocket.close(code=1011, reason="Internal error")
        except Exception:
            pass
    finally:
        if hub is not None:
            await hub.clear_upstream_if_matches(websocket)


@router.websocket("/ws/rates")
async def rates_ws(websocket: WebSocket):
    exchange_id = websocket.query_params.get("exchange_id")
    await websocket.accept()

    if not exchange_id or not exchange_id.strip():
        await websocket.close(code=1008, reason="Missing exchange_id query parameter")
        return

    exchange_id = exchange_id.strip()
    hub = hub_manager.get_hub(exchange_id)
    if hub is None:
        await websocket.close(code=1008, reason="Unknown exchange_id")
        return

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
        {"type": "auth", "status": "ok", "username": user.username, "exchange_id": exchange_id}
    )

    if hub.latest_rates:
        await websocket.send_json(hub.latest_rates)

    await hub.subscribe(websocket)

    try:
        while websocket.client_state == WebSocketState.CONNECTED:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await hub.unsubscribe(websocket)
