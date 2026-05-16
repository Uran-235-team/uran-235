import asyncio
import json
import os
import traceback

import websockets

from emulator import rates, start_emulator, TICK_RATE


async def run() -> None:
    start_emulator()

    url = os.environ["API_INGEST_WS_URL"]
    exchange_id = os.environ["EXCHANGE_ID"]
    title = os.environ["EXCHANGE_TITLE"]
    secret = os.environ.get("EMULATOR_INGEST_SECRET", "")
    reconnect_delay = float(os.environ.get("EMULATOR_RECONNECT_SECONDS", "3"))

    while True:
        try:
            async with websockets.connect(url) as ws:
                hello: dict[str, str] = {"exchange_id": exchange_id, "title": title}
                if secret:
                    hello["secret"] = secret
                await ws.send(json.dumps(hello))

                while True:
                    snapshot = dict(rates)
                    await ws.send(json.dumps(snapshot))
                    await asyncio.sleep(TICK_RATE)
        except Exception:
            traceback.print_exc()
            await asyncio.sleep(reconnect_delay)


if __name__ == "__main__":
    asyncio.run(run())
