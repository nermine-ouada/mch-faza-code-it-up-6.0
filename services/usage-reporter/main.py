"""Minimal optional collector for USAGE_WEBHOOK_URL (in-memory demo)."""

from collections import deque

from fastapi import FastAPI

app = FastAPI(title="Sandy Lab usage reporter", version="0.1.0")
_events: deque[dict] = deque(maxlen=500)


@app.post("/ingest")
async def ingest(event: dict) -> dict:
    _events.appendleft(event)
    return {"ok": True, "stored": len(_events)}


@app.get("/events")
async def list_events(limit: int = 50) -> list[dict]:
    n = max(1, min(limit, 200))
    return list(_events)[:n]


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
