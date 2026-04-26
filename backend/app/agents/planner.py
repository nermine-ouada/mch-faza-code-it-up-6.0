from __future__ import annotations

import logging
import os
from typing import Any

from deepagents import create_deep_agent

from app.agents.llm import openrouter_model_pool
from app.agents.subagents import build_subagents
from app.config import get_settings

PLANNER_SYSTEM_PROMPT = """You are Sandy's Planner Agent for the Treedome Lab OS.

Your job is to orchestrate specialist sub-agents using the built-in delegation tools:
- research-agent: web research + caching summaries
- database-agent: proposes read-only SELECTs; can update projects after explicit approval
- inventory-agent: low stock checks + structured ledger writes (not raw SQL; consider approval UX later for writes)

Rules:
- Delegate concrete work to the right specialist; do not pretend you executed SQL or inventory updates yourself.
- If the user request spans multiple domains, decompose it and delegate in a sensible order.
- Prefer inventory-agent for anything involving stock counts, shortages, or recording stock movements.
- Prefer database-agent for structured questions about projects/experiments/logs.
- Prefer research-agent for external knowledge, protocols, safety guidance, or novelty ideas.
- Keep the final user-facing answer concise, actionable, and aligned with lab operations.
"""

_log = logging.getLogger(__name__)
_planner_by_model: dict[str, Any] = {}
_current_model_idx = 0


def _model_pool() -> list[str]:
    pool = openrouter_model_pool()
    if not pool:
        raise RuntimeError("No OpenRouter model configured.")
    return pool


def current_model_id() -> str:
    pool = _model_pool()
    idx = _current_model_idx % len(pool)
    return pool[idx]


def rotate_model() -> str:
    global _current_model_idx
    pool = _model_pool()
    if len(pool) <= 1:
        return pool[0]
    _current_model_idx = (_current_model_idx + 1) % len(pool)
    nxt = pool[_current_model_idx]
    _log.warning("planner: rotating OpenRouter model to %s", nxt)
    return nxt


def get_planner() -> Any:
    """Return a compiled LangGraph deep agent (lazy singleton)."""
    settings = get_settings()
    if not settings.openrouter_api_key.strip():
        raise RuntimeError("OPENROUTER_API_KEY is not set (required for /api/chat/stream).")

    os.environ["OPENROUTER_API_KEY"] = settings.openrouter_api_key.strip()
    model_id = current_model_id()

    if model_id in _planner_by_model:
        return _planner_by_model[model_id]

    planner = create_deep_agent(
        model=model_id,
        tools=[],
        system_prompt=PLANNER_SYSTEM_PROMPT,
        subagents=build_subagents(),
    )
    _planner_by_model[model_id] = planner
    _log.info("planner: initialized model %s", model_id)
    return planner
