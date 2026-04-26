import asyncio
import json
import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import httpx

from app.agents.planner import current_model_id, get_planner, rotate_model
from app.agents.request_context import agent_request_user_id
from app.auth import get_current_user
from app.config import get_settings
from app.db import AsyncSessionLocal
from app.models import AIActionLog, AgentSqlProposal, User
from app.schemas import ChatRequest
from app.usage_forward import forward_usage_event

router = APIRouter(prefix="/chat", tags=["chat"])
_log = logging.getLogger(__name__)


def _json_default(obj: Any) -> Any:
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return str(obj)


def _looks_like_retryable_model_error(exc: Exception) -> bool:
    text = str(exc).lower()
    if "429" in text:
        return True
    if "rate limit" in text or "ratelimit" in text:
        return True
    if "quota" in text and "exceed" in text:
        return True
    if "no endpoints found" in text:
        return True
    if "temporarily unavailable" in text:
        return True
    code = getattr(exc, "status_code", None)
    return code == 429


async def _openrouter_free_chat_completion(*, api_key: str, prompt: str) -> dict[str, Any]:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "openrouter/free",
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=45.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()


def _needs_sql_first(message: str) -> bool:
    m = (message or "").lower()
    return (
        ("sql" in m or "query" in m or "database" in m or "record" in m)
        and ("summary" in m or "current" in m or "validate" in m)
    )


def _summary_sql() -> str:
    return (
        "SELECT "
        "(SELECT COUNT(*) FROM projects) AS projects_total, "
        "(SELECT COUNT(*) FROM projects WHERE status = 'ongoing') AS projects_ongoing, "
        "(SELECT COUNT(*) FROM inventory) AS inventory_items, "
        "(SELECT COUNT(*) FROM inventory WHERE quantity < min_required) AS low_stock_items, "
        "(SELECT COUNT(*) FROM experiments_log) AS experiments_total, "
        "(SELECT COUNT(*) FROM experiments_log WHERE success IS TRUE) AS experiments_success"
    )


@router.post("/stream")
async def stream_agent_run(
    body: ChatRequest,
    user: User = Depends(get_current_user),
) -> StreamingResponse:
    settings = get_settings()
    session_id = (body.session_id or "").strip() or str(uuid.uuid4())
    prompt_text = body.message or ""
    async with AsyncSessionLocal() as db:
        log = AIActionLog(
            action_type="chat_stream",
            description=prompt_text[:2000],
            user_id=user.id,
            agent="planner",
            action_metadata={
                "model": current_model_id(),
                "prompt_chars": len(prompt_text),
                "session_id": session_id,
                "prompt_text": prompt_text[:8000],
            },
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        log_id = log.id

    if settings.usage_webhook_url.strip():
        asyncio.create_task(
            forward_usage_event(
                settings.usage_webhook_url,
                {
                    "kind": "chat_stream",
                    "user_id": user.id,
                    "model": current_model_id(),
                    "prompt_chars": len(prompt_text),
                    "session_id": session_id,
                },
            )
        )

    async def event_gen():
        agent_request_user_id.set(user.id)
        updates: list[str] = []
        final_response = ""
        try:
            if settings.openrouter_model.strip() == "openrouter/free":
                yield (
                    "data: "
                    + json.dumps(
                        {
                            "update": {
                                "planner": {
                                    "phase": "start",
                                    "mode": "openrouter-free-http-fallback",
                                    "message": "Planner started. Will stream explicit agent steps.",
                                }
                            }
                        }
                    )
                    + "\n\n"
                )
                if _needs_sql_first(body.message or ""):
                    sql_text = _summary_sql()
                    async with AsyncSessionLocal() as db:
                        prop = AgentSqlProposal(
                            user_id=user.id,
                            sql_text=sql_text,
                            rationale="User requested SQL-first validation before summary.",
                            status="pending",
                        )
                        db.add(prop)
                        await db.commit()
                        await db.refresh(prop)
                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "update": {
                                    "database-agent": {
                                        "phase": "propose_sql",
                                        "proposal_id": prop.id,
                                        "sql": sql_text,
                                        "next_step": (
                                            "Review in AI Oversight and approve the proposal "
                                            "to execute this SQL."
                                        ),
                                    }
                                }
                            }
                        )
                        + "\n\n"
                    )
                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "update": {
                                    "planner": {
                                        "phase": "awaiting_human_validation",
                                        "message": (
                                            "Paused for human SQL approval. No database rows were read yet."
                                        ),
                                    }
                                }
                            }
                        )
                        + "\n\n"
                    )
                    yield "data: [DONE]\n\n"
                    return
                data = await _openrouter_free_chat_completion(
                    api_key=settings.openrouter_api_key.strip(),
                    prompt=prompt_text,
                )
                reply = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                )
                model_used = data.get("model", "openrouter/free")
                final_response = reply
                yield (
                    "data: "
                    + json.dumps(
                        {
                            "update": {
                                "research-agent": {
                                    "phase": "llm_response",
                                    "model": model_used,
                                    "reply": reply,
                                }
                            }
                        }
                    )
                    + "\n\n"
                )
                yield "data: [DONE]\n\n"
                return

            payload = {"messages": [{"role": "user", "content": body.message}]}
            attempts = max(1, len(settings.openrouter_model_pool()))
            last_exc: Exception | None = None
            yield (
                "data: "
                + json.dumps(
                    {
                        "update": {
                            "meta": f"run started with {current_model_id()}",
                            "attempts": attempts,
                        }
                    }
                )
                + "\n\n"
            )

            for attempt in range(attempts):
                model_id = current_model_id()
                try:
                    planner = get_planner()
                    if attempt > 0:
                        yield f"data: {json.dumps({'update': {'meta': f'retrying with {model_id}'}})}\n\n"
                    async for chunk in planner.astream(payload, stream_mode="updates"):
                        line = json.dumps({"update": chunk}, default=_json_default)
                        if len(updates) < 200:
                            updates.append(line[:1000])
                        yield f"data: {line}\n\n"
                    return
                except Exception as exc:  # noqa: BLE001
                    last_exc = exc
                    if not _looks_like_retryable_model_error(exc) or attempt == attempts - 1:
                        raise
                    nxt = rotate_model()
                    _log.warning(
                        "chat.stream: rate-limited on model=%s, retrying with model=%s (%s/%s)",
                        model_id,
                        nxt,
                        attempt + 2,
                        attempts,
                    )
            if last_exc is not None:
                raise last_exc
        except Exception as exc:  # noqa: BLE001
            _log.exception("chat.stream failed: %s", exc)
            err_payload = {
                "update": {
                    "error": str(exc),
                    "meta": "stream failed before completion",
                }
            }
            yield f"data: {json.dumps(err_payload, default=_json_default)}\n\n"
            yield "data: [DONE]\n\n"
        finally:
            # Persist completion details for session history and expandable logs.
            try:
                async with AsyncSessionLocal() as db2:
                    row = await db2.get(AIActionLog, log_id)
                    if row is not None:
                        meta = dict(row.action_metadata or {})
                        meta["session_id"] = session_id
                        meta["prompt_text"] = prompt_text[:8000]
                        if final_response:
                            meta["response_text"] = final_response[:20000]
                            meta["response_chars"] = len(final_response)
                        elif updates:
                            meta["response_text"] = "\n".join(updates)[:20000]
                            meta["response_chars"] = len(meta["response_text"])
                        meta["update_count"] = len(updates)
                        row.action_metadata = meta
                        await db2.commit()
            except Exception:  # noqa: BLE001
                _log.exception("chat.stream: failed to persist session history")

    return StreamingResponse(event_gen(), media_type="text/event-stream")
