import asyncio
import logging
from datetime import datetime
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.rates.ingest import normalize_emulator_payload, observed_as_date

logger = logging.getLogger(__name__)


class ExchangeHub:
    """One exchange: downstream retail clients + rates pushed by emulator."""

    def __init__(self, exchange_id: str, title: str) -> None:
        self.exchange_id = exchange_id
        self.title = title
        self.latest_rates: dict[str, Any] = {}
        self.observed_at: datetime | None = None
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self._upstream_lock = asyncio.Lock()
        self._upstream: WebSocket | None = None

    async def replace_upstream(self, websocket: WebSocket) -> None:
        async with self._upstream_lock:
            previous = self._upstream
            self._upstream = websocket
        if previous is not None and previous is not websocket:
            try:
                await previous.close(code=4000, reason="Replaced by another emulator")
            except Exception:
                pass

    def is_current_upstream(self, websocket: WebSocket) -> bool:
        return self._upstream is websocket

    async def subscribe(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.add(websocket)

    async def unsubscribe(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(websocket)

    def client_payload(self) -> dict[str, Any]:
        payload: dict[str, Any] = {"rates": self.latest_rates}
        if self.observed_at is not None:
            payload["observed_at"] = self.observed_at.isoformat().replace("+00:00", "Z")
        return payload

    def pricing_as_of(self):
        return observed_as_date(self.observed_at)

    async def ingest_and_broadcast(self, payload: dict[str, Any]) -> None:
        rates, observed_at = normalize_emulator_payload(payload)
        self.latest_rates = rates
        if observed_at is not None:
            self.observed_at = observed_at
        await self._broadcast(self.client_payload())

    async def _broadcast(self, message: dict[str, Any]) -> None:
        async with self._lock:
            clients = list(self._clients)

        dead: list[WebSocket] = []
        for client in clients:
            if client.client_state != WebSocketState.CONNECTED:
                dead.append(client)
                continue
            try:
                await client.send_json(message)
            except (WebSocketDisconnect, RuntimeError):
                dead.append(client)

        if dead:
            async with self._lock:
                for client in dead:
                    self._clients.discard(client)

    async def shutdown(self) -> None:
        async with self._upstream_lock:
            self._upstream = None
        async with self._lock:
            clients = list(self._clients)
            self._clients.clear()
        for client in clients:
            try:
                await client.close(code=1011, reason="Exchange went offline")
            except Exception:
                pass


class ExchangeHubManager:
    def __init__(self) -> None:
        self._hubs: dict[str, ExchangeHub] = {}
        self._lock = asyncio.Lock()

    def get_hub(self, exchange_id: str) -> ExchangeHub | None:
        return self._hubs.get(exchange_id)

    def list_exchanges(self) -> list[tuple[str, str]]:
        return [(hub.exchange_id, hub.title) for hub in self._hubs.values()]

    async def register(
        self, exchange_id: str, title: str, websocket: WebSocket
    ) -> ExchangeHub:
        async with self._lock:
            hub = self._hubs.get(exchange_id)
            if hub is None:
                hub = ExchangeHub(exchange_id, title)
                self._hubs[exchange_id] = hub
            else:
                hub.title = title
        await hub.replace_upstream(websocket)
        return hub

    async def unregister(self, exchange_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            hub = self._hubs.get(exchange_id)
            if hub is None:
                return
            if not hub.is_current_upstream(websocket):
                return
            del self._hubs[exchange_id]
        await hub.shutdown()


hub_manager = ExchangeHubManager()
