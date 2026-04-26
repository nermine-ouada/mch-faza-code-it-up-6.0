from __future__ import annotations

import os

from langchain_core.tools import tool

from app.config import get_settings
from app.db import SyncSessionLocal
from app.models import ResearchCache


@tool
def web_search(query: str) -> str:
    """Search the public web for recent information (Tavily when TAVILY_API_KEY is set)."""
    settings = get_settings()
    key = settings.tavily_api_key or os.environ.get("TAVILY_API_KEY", "")
    if not key:
        return (
            "Tavily API key is not configured. Set TAVILY_API_KEY in .env for live web search. "
            f"Query was: {query!r}"
        )
    try:
        from tavily import TavilyClient

        client = TavilyClient(api_key=key)
        resp = client.search(query, max_results=5)
        return str(resp)
    except Exception as exc:  # noqa: BLE001
        return f"web_search error: {exc}"


@tool
def cache_research(topic: str, summary: str, source: str) -> str:
    """Persist a research summary to research_cache for reuse and citations."""
    with SyncSessionLocal() as session:
        row = ResearchCache(topic=topic, summary=summary, source=source)
        session.add(row)
        session.commit()
        return f"OK: cached research id={row.id} topic={topic!r}"
