"""Mock GDS: returns the supplied JSON for every search, whatever the params.

Demo knobs: MOCK_GDS_LATENCY_MS (slow provider) and MOCK_GDS_FAIL_MODE=error|timeout|malformed.
"""

import asyncio
import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse, PlainTextResponse

DATA_FILE = Path(__file__).with_name("gds_response.json")

app = FastAPI(title="Mock GDS API", version="1.0.0")


@lru_cache(maxsize=1)
def load_response() -> dict:
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/mock-gds/search")
async def search(
    source: Annotated[str, Query(min_length=1)],
    destination: Annotated[str, Query(min_length=1)],
    journey_date: Annotated[str, Query(min_length=1)],
):
    # Required like a real provider, but deliberately not used to filter:
    # deciding which trips match is the backend's job.
    latency_ms = int(os.getenv("MOCK_GDS_LATENCY_MS", "0"))
    if latency_ms > 0:
        await asyncio.sleep(latency_ms / 1000)

    fail_mode = os.getenv("MOCK_GDS_FAIL_MODE", "none").lower()
    if fail_mode == "error":
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Simulated provider failure"},
        )
    if fail_mode == "timeout":
        await asyncio.sleep(30)  # longer than the backend's timeout
    if fail_mode == "malformed":
        return PlainTextResponse("<html>Bad Gateway</html>")

    return load_response()
