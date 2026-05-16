import asyncio
import json
import logging
import re

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.websockets import WebSocketState

from app.config import settings
from app.dependencies import get_current_user
from app.rates.hub import hub_manager
from app.rates.pricing import apply_assignments
from app.rates.schemas import ExchangePublic, PricedRatesResponse
from app.rule_assignments import repository as assignments_repository
from app.security import AccessTokenError, verify_access_token
from app.redis_client import redis_client
from db.models.user import User
from db.session import SessionLocal, get_session

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Rates"])

_EXCHANGE_ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
_TITLE_MAX_LEN = 128


@router.get("/exchanges", response_model=list[ExchangePublic])
async def list_exchanges(current_user: User = Depends(get_current_user)):
    return [
        ExchangePublic(id=ex_id, title=title)
        for ex_id, title in hub_manager.list_exchanges()
    ]


@router.get(
    "/exchanges/{exchange_id}/rates",
    response_model=PricedRatesResponse,
)
async def get_priced_rates(
    exchange_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    exchange_id = exchange_id.strip()
    if not _EXCHANGE_ID_RE.fullmatch(exchange_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid exchange_id",
        )

    hub = hub_manager.get_hub(exchange_id)
    if hub is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange is not connected",
        )

    assignments = await assignments_repository.list_for_user_with_rules(
        session, current_user.id
    )
    rates = apply_assignments(
        exchange_id=exchange_id,
        latest_rates=hub.latest_rates,
        assignments=assignments,
        as_of=hub.pricing_as_of(),
    )
    return PricedRatesResponse(exchange_id=exchange_id, rates=rates)


@router.websocket("/ws/emulator")
async def emulator_ingest_ws(websocket: WebSocket):
    await websocket.accept()
    registered_id: str | None = None
    try:
        raw = await asyncio.wait_for(
            websocket.receive_text(),
            timeout=settings.ws_auth_timeout_seconds,
        )
        hello = json.loads(raw)
        if not isinstance(hello, dict):
            await websocket.close(code=1008, reason="Handshake must be a JSON object")
            return

        exchange_id = (hello.get("exchange_id") or "").strip()
        title = (hello.get("title") or "").strip()
        if not _EXCHANGE_ID_RE.fullmatch(exchange_id):
            await websocket.close(code=1008, reason="Invalid exchange_id")
            return
        if not (1 <= len(title) <= _TITLE_MAX_LEN):
            await websocket.close(code=1008, reason="Invalid title")
            return

        if settings.emulator_ingest_secret:
            if (hello.get("secret") or "") != settings.emulator_ingest_secret:
                await websocket.close(code=1008, reason="Invalid ingest secret")
                return

        hub = await hub_manager.register(exchange_id, title, websocket)
        registered_id = exchange_id
        logger.info("Emulator connected for exchange %s (%s)", exchange_id, title)

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
        if registered_id is not None:
            await hub_manager.unregister(registered_id, websocket)


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
        await websocket.send_json(hub.client_payload())

    await hub.subscribe(websocket)

    try:
        while websocket.client_state == WebSocketState.CONNECTED:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await hub.unsubscribe(websocket)
