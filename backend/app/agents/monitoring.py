from __future__ import annotations

from datetime import datetime
from typing import Any

from langchain_core.callbacks import BaseCallbackHandler


def _ts() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _to_text(x: Any, limit: int = 400) -> str:
    s = str(x)
    return s if len(s) <= limit else s[:limit] + "…"


def _safe_int(v: Any) -> int | None:
    try:
        if v is None:
            return None
        return int(v)
    except Exception:  # noqa: BLE001
        return None


def _safe_float(v: Any) -> float | None:
    try:
        if v is None:
            return None
        return float(v)
    except Exception:  # noqa: BLE001
        return None


def _usage_from_dict(d: dict[str, Any]) -> dict[str, Any]:
    prompt = _safe_int(d.get("prompt_tokens") or d.get("input_tokens"))
    completion = _safe_int(d.get("completion_tokens") or d.get("output_tokens"))
    total = _safe_int(d.get("total_tokens"))
    if total is None:
        total = (prompt or 0) + (completion or 0) or None
    cost = _safe_float(d.get("cost") or d.get("cost_usd") or d.get("total_cost"))
    return {
        "prompt_tokens": prompt,
        "completion_tokens": completion,
        "total_tokens": total,
        "cost_usd": cost,
    }


def _extract_usage(response: Any) -> dict[str, Any]:
    """Pull provider token usage from any of the places LangChain can stash it."""
    usage: dict[str, Any] = {}

    # 1) LLMResult.llm_output (legacy / non-streaming path on some providers).
    llm_output = getattr(response, "llm_output", None) or {}
    if isinstance(llm_output, dict):
        maybe = llm_output.get("token_usage") or llm_output.get("usage")
        if isinstance(maybe, dict):
            usage = dict(maybe)

    # 2) Direct usage_metadata on the response (AIMessage-like).
    if not usage:
        maybe = getattr(response, "usage_metadata", None)
        if isinstance(maybe, dict):
            usage = dict(maybe)

    # 3) Walk into generations[0][0].message — this is where ChatOpenRouter
    #    (and most chat models) actually store usage on the AIMessage.
    if not usage:
        generations = getattr(response, "generations", None)
        if isinstance(generations, list) and generations:
            first_group = generations[0]
            if isinstance(first_group, list) and first_group:
                gen0 = first_group[0]
                msg = getattr(gen0, "message", None)
                # 3a) AIMessage.usage_metadata (preferred, modern path).
                if msg is not None:
                    um = getattr(msg, "usage_metadata", None)
                    if isinstance(um, dict):
                        usage = dict(um)
                # 3b) AIMessage.response_metadata.token_usage (OpenAI-style).
                if not usage and msg is not None:
                    rm = getattr(msg, "response_metadata", None)
                    if isinstance(rm, dict):
                        maybe = rm.get("token_usage") or rm.get("usage")
                        if isinstance(maybe, dict):
                            usage = dict(maybe)
                # 3c) Generation.generation_info.token_usage (older fallback).
                if not usage:
                    gen_info = getattr(gen0, "generation_info", None)
                    if isinstance(gen_info, dict):
                        maybe = gen_info.get("token_usage") or gen_info.get("usage")
                        if isinstance(maybe, dict):
                            usage = dict(maybe)

    if not usage:
        return {"prompt_tokens": None, "completion_tokens": None, "total_tokens": None, "cost_usd": None}

    # Some providers report cost separately in response_metadata, merge it in if available.
    if "cost" not in usage and "cost_usd" not in usage and "total_cost" not in usage:
        generations = getattr(response, "generations", None)
        if isinstance(generations, list) and generations:
            first_group = generations[0]
            if isinstance(first_group, list) and first_group:
                gen0 = first_group[0]
                msg = getattr(gen0, "message", None)
                rm = getattr(msg, "response_metadata", None) if msg is not None else None
                if isinstance(rm, dict):
                    cost = rm.get("cost") or rm.get("cost_usd") or rm.get("total_cost")
                    if cost is not None:
                        usage["cost_usd"] = cost
    return _usage_from_dict(usage)


class AgentMonitoringCallbackHandler(BaseCallbackHandler):
    """Collect structured LangChain callback events for oversight logging."""

    def __init__(self, *, source: str, session_id: str) -> None:
        self.source = source
        self.session_id = session_id
        self.events: list[dict[str, Any]] = []

    def _add(self, kind: str, **payload: Any) -> None:
        self.events.append(
            {
                "at": _ts(),
                "source": self.source,
                "session_id": self.session_id,
                "kind": kind,
                **payload,
            },
        )

    def on_chain_start(self, serialized: dict[str, Any], inputs: dict[str, Any], **kwargs: Any) -> Any:
        self._add("chain_start", name=serialized.get("name") or "chain", input_keys=list(inputs.keys()))

    def on_chain_end(self, outputs: dict[str, Any], **kwargs: Any) -> Any:
        self._add("chain_end", output_keys=list(outputs.keys()))

    def on_chain_error(self, error: BaseException, **kwargs: Any) -> Any:
        self._add("chain_error", error=_to_text(error))

    def on_llm_start(self, serialized: dict[str, Any], prompts: list[str], **kwargs: Any) -> Any:
        self._add(
            "llm_start",
            name=serialized.get("name") or "llm",
            prompt_count=len(prompts),
            prompt_preview=_to_text(prompts[0]) if prompts else "",
        )

    def on_llm_end(self, response: Any, **kwargs: Any) -> Any:
        usage = _extract_usage(response)
        self._add(
            "llm_end",
            generations=_to_text(getattr(response, "generations", "")),
            usage=usage,
        )

    def on_llm_error(self, error: BaseException, **kwargs: Any) -> Any:
        self._add("llm_error", error=_to_text(error))

    def on_tool_start(self, serialized: dict[str, Any], input_str: str, **kwargs: Any) -> Any:
        self._add(
            "tool_start",
            name=serialized.get("name") or "tool",
            input_preview=_to_text(input_str),
        )

    def on_tool_end(self, output: Any, **kwargs: Any) -> Any:
        self._add("tool_end", output_preview=_to_text(output))

    def on_tool_error(self, error: BaseException, **kwargs: Any) -> Any:
        self._add("tool_error", error=_to_text(error))


def callbacks_to_orchestration_trace(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    trace: list[dict[str, Any]] = []
    for idx, e in enumerate(events, start=1):
        kind = str(e.get("kind") or "")
        speaker = "planner"
        content = kind
        tool_name = None
        if kind.startswith("tool_"):
            speaker = "tool"
            tool_name = e.get("name")
            content = f"{kind}: {e.get('output_preview') or e.get('input_preview') or ''}".strip()
        elif kind.startswith("llm_"):
            speaker = "ai"
            content = f"{kind}: {e.get('prompt_preview') or e.get('generations') or ''}".strip()
        elif kind.startswith("chain_"):
            speaker = "planner"
            content = f"{kind}: {e.get('name') or ''}".strip()
        row: dict[str, Any] = {"step": idx, "speaker": speaker, "content": content[:500]}
        if tool_name:
            row["tool_calls"] = [{"name": str(tool_name)}]
        trace.append(row)
    return trace


def callbacks_token_usage(events: list[dict[str, Any]]) -> tuple[int | None, float | None]:
    total_tokens = 0
    total_cost = 0.0
    saw_tokens = False
    saw_cost = False
    for e in events:
        if str(e.get("kind") or "") != "llm_end":
            continue
        usage = e.get("usage")
        if not isinstance(usage, dict):
            continue
        t = _safe_int(usage.get("total_tokens"))
        c = _safe_float(usage.get("cost_usd"))
        if t is not None:
            total_tokens += t
            saw_tokens = True
        if c is not None:
            total_cost += c
            saw_cost = True
    return (total_tokens if saw_tokens else None, total_cost if saw_cost else None)
