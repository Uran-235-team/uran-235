import asyncio
import logging
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.config import ExchangeDefinition, settings

logger = logging.getLogger(__name__)


class ExchangeHub:
    """One exchange: downstream retail clients + rates pushed by emulator."""

    def __init__(self, exchange_id: str) -> None:
        self.exchange_id = exchange_id
        self.latest_rates: dict[str, Any] = {}
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self._upstream_lock = asyncio.Lock()
        self._upstream: WebSocket | None = None
        self.online: bool = False

    async def replace_upstream(self, websocket: WebSocket) -> None:
        async with self._upstream_lock:
            previous = self._upstream
            self._upstream = websocket
            self.online = True
        if previous is not None and previous is not websocket:
            try:
                await previous.close(code=4000, reason="Replaced by another emulator")
            except Exception:
                pass

    async def clear_upstream_if_matches(self, websocket: WebSocket) -> None:
        async with self._upstream_lock:
            if self._upstream == websocket:
                self._upstream = None
                self.online = False

    async def subscribe(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.add(websocket)

    async def unsubscribe(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(websocket)

    async def ingest_and_broadcast(self, rates: dict[str, Any]) -> None:
        self.latest_rates = rates
        await self._broadcast(rates)

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


class ExchangeHubManager:
    def __init__(self, exchange_ids: list[str]) -> None:
        self._hubs = {eid: ExchangeHub(eid) for eid in exchange_ids}

    def known_exchange_ids(self) -> frozenset[str]:
        return frozenset(self._hubs.keys())

    def get_hub(self, exchange_id: str) -> ExchangeHub | None:
        return self._hubs.get(exchange_id)

    def exchange_online(self, exchange_id: str) -> bool:
        hub = self._hubs.get(exchange_id)
        return hub.online if hub is not None else False


def build_hub_manager_from_definitions(
    definitions: tuple[ExchangeDefinition, ...],
) -> ExchangeHubManager:
    ids = [ex.id for ex in definitions]
    return ExchangeHubManager(ids)


hub_manager = build_hub_manager_from_definitions(settings.exchanges)
