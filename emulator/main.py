import asyncio
import json
import os
import traceback

import websockets

from emulator import ExchangeEmulator, TICK_RATE, load_exchanges

EXCHANGES_PATH = os.environ.get("EXCHANGES_PATH", "/app/exchanges.yaml")


async def run_instance(
    emu: ExchangeEmulator, url: str, secret: str, reconnect_delay: float
) -> None:
    while True:
        try:
            async with websockets.connect(url) as ws:
                hello: dict[str, str] = {"exchange_id": emu.exchange_id, "title": emu.title}
                if secret:
                    hello["secret"] = secret
                await ws.send(json.dumps(hello))

                while True:
                    emu.tick()
                    await ws.send(json.dumps(emu.snapshot()))
                    await asyncio.sleep(TICK_RATE)
        except Exception:
            traceback.print_exc()
            await asyncio.sleep(reconnect_delay)


async def run() -> None:
    exchanges = load_exchanges(EXCHANGES_PATH)
    if not exchanges:
        raise SystemExit(f"{EXCHANGES_PATH}: no exchanges defined")

    url = os.environ["API_INGEST_WS_URL"]
    secret = os.environ.get("EMULATOR_INGEST_SECRET", "")
    reconnect_delay = float(os.environ.get("EMULATOR_RECONNECT_SECONDS", "3"))

    print(f"launching {len(exchanges)} emulator instance(s): "
          f"{[ex['id'] for ex in exchanges]}", flush=True)

    tasks = [
        asyncio.create_task(
            run_instance(
                ExchangeEmulator(ex["id"], ex["title"]),
                url,
                secret,
                reconnect_delay,
            )
        )
        for ex in exchanges
    ]
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(run())
