"""Optional forward of usage events to an external collector (microservice / analytics)."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

_log = logging.getLogger(__name__)


async def forward_usage_event(url: str, payload: dict[str, Any]) -> None:
    if not url.strip():
        return
    try:
        import httpx
    except ImportError:
        _log.debug("httpx not installed; skip usage webhook")
        return

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            await client.post(url, json=payload)
    except Exception as exc:  # noqa: BLE001
        _log.warning("Usage webhook failed: %s", exc)
