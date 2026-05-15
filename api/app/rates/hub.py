import asyncio
import json
import logging
from typing import Any

import websockets
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.config import settings

logger = logging.getLogger(__name__)

RECONNECT_DELAY_SECONDS = 3


class RatesHub:
    def __init__(self) -> None:
        self.latest_rates: dict[str, Any] = {}
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self._upstream_task: asyncio.Task | None = None
        self._stopped = False

    async def start(self) -> None:
        self._stopped = False
        self._upstream_task = asyncio.create_task(self._upstream_loop())

    async def stop(self) -> None:
        self._stopped = True
        if self._upstream_task is not None:
            self._upstream_task.cancel()
            try:
                await self._upstream_task
            except asyncio.CancelledError:
                pass
            self._upstream_task = None

    async def subscribe(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.add(websocket)

    async def unsubscribe(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(websocket)

    async def _upstream_loop(self) -> None:
        while not self._stopped:
            try:
                async with websockets.connect(settings.emulator_ws_url) as upstream:
                    logger.info("Connected to emulator at %s", settings.emulator_ws_url)
                    async for message in upstream:
                        rates = json.loads(message)
                        self.latest_rates = rates
                        await self._broadcast(rates)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("Emulator upstream error: %s", exc)
                if not self._stopped:
                    await asyncio.sleep(RECONNECT_DELAY_SECONDS)

    async def _broadcast(self, rates: dict[str, Any]) -> None:
        async with self._lock:
            clients = list(self._clients)

        dead: list[WebSocket] = []
        for client in clients:
            if client.client_state != WebSocketState.CONNECTED:
                dead.append(client)
                continue
            try:
                await client.send_json(rates)
            except (WebSocketDisconnect, RuntimeError):
                dead.append(client)

        if dead:
            async with self._lock:
                for client in dead:
                    self._clients.discard(client)


rates_hub = RatesHub()
