import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
import re
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.agents.planner import current_model_id, get_planner, rotate_model
from app.agents.request_context import agent_request_user_id
from app.agents.tools.db_tools import validate_read_only_select
from app.auth import get_current_user
from app.config import get_settings
from app.db import get_db, sync_engine
from app.models import AIActionLog, AgentSqlProposal, User

router = APIRouter(prefix="/agent", tags=["agent"])
_SESSIONS: dict[str, dict[str, Any]] = {}
_log = logging.getLogger(__name__)
_MAX_SESSION_MESSAGES = 24
_WRITE_INTENT_RE = re.compile(
    r"\b(create|add|insert|update|edit|modify|change|delete|remove|set status|record stock|restock|deduct)\b",
    re.IGNORECASE,
)
_DELETE_INTENT_RE = re.compile(r"\b(delete|remove)\b", re.IGNORECASE)
_CREATE_INTENT_RE = re.compile(r"\b(create|add|insert)\b", re.IGNORECASE)
_STATUS_RE = re.compile(r"\b(planned|ongoing|completed)\b", re.IGNORECASE)
_PRIORITY_RE = re.compile(r"\bpriority\s*(?:to|=)?\s*(\d{1,2})\b", re.IGNORECASE)
_PROJECT_QUOTED_RE = re.compile(r"project\s+[\"']([^\"']+)[\"']", re.IGNORECASE)
_PROJECT_FALLBACK_RE = re.compile(r"project\s+([a-z0-9][a-z0-9 \-_]{1,80})", re.IGNORECASE)
_DESCRIPTION_RE = re.compile(r"\bdescription\s*(?:=|to|:)?\s*[\"']([^\"']+)[\"']", re.IGNORECASE)


class AgentChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class AgentApproveRequest(BaseModel):
    session_id: str
    approved: bool
    action_id: Optional[int] = None


def _safe_json_default(obj: Any) -> Any:
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return str(obj)


def _extract_response_text(result: Any) -> str:
    if not result:
        return ""
    msgs = result.get("messages") if isinstance(result, dict) else None
    if not msgs:
        return str(result)
    last = msgs[-1]
    if isinstance(last, dict):
        content = last.get("content")
        return content if isinstance(content, str) else str(last)
    content = getattr(last, "content", None)
    if isinstance(content, str):
        return content
    return str(last)


def _extract_orchestration_trace(result: Any) -> list[dict[str, Any]]:
    """Build lightweight trace rows from planner/subagent messages."""
    trace: list[dict[str, Any]] = []
    if not isinstance(result, dict):
        return trace
    msgs = result.get("messages")
    if not isinstance(msgs, list):
        return trace

    for idx, msg in enumerate(msgs, start=1):
        row: dict[str, Any] = {"step": idx}
        if isinstance(msg, dict):
            role = msg.get("role")
            content = msg.get("content")
            row["speaker"] = str(role or "agent")
            if isinstance(content, str):
                row["content"] = content[:500]
            tool_calls = msg.get("tool_calls")
            if isinstance(tool_calls, list) and tool_calls:
                row["tool_calls"] = [
                    {
                        "name": tc.get("name"),
                        "args": tc.get("args"),
                    }
                    for tc in tool_calls
                    if isinstance(tc, dict)
                ][:8]
            trace.append(row)
            continue

        role = getattr(msg, "role", None) or getattr(msg, "type", None) or msg.__class__.__name__
        row["speaker"] = str(role)
        content = getattr(msg, "content", None)
        if isinstance(content, str):
            row["content"] = content[:500]
        elif isinstance(content, list):
            row["content"] = str(content)[:500]
        tool_calls = getattr(msg, "tool_calls", None)
        if isinstance(tool_calls, list) and tool_calls:
            parsed_calls = []
            for tc in tool_calls[:8]:
                if isinstance(tc, dict):
                    parsed_calls.append({"name": tc.get("name"), "args": tc.get("args")})
                else:
                    parsed_calls.append({"name": str(tc)})
            row["tool_calls"] = parsed_calls
        trace.append(row)
    return trace


def _fallback_response_from_trace(trace: list[dict[str, Any]]) -> str:
    """Build a user-facing fallback when model output has no final text."""
    if not trace:
        return "I completed the step, but no final text was returned. Please retry or ask me to summarize the latest result."
    for row in reversed(trace):
        content = row.get("content")
        if isinstance(content, str) and content.strip():
            return content.strip()
    speakers: list[str] = []
    for row in trace:
        sp = row.get("speaker")
        if isinstance(sp, str) and sp and sp not in speakers:
            speakers.append(sp)
    if speakers:
        return (
            "I completed the orchestration step"
            f" ({', '.join(speakers[:4])})"
            ", but no final assistant message was produced. Ask me to continue from the last result."
        )
    return "I completed the step, but no final text was returned."


def _invoke_planner(messages: list[dict[str, str]], session_id: str) -> Any:
    planner = get_planner()
    payload = {"messages": messages}
    config = {"configurable": {"thread_id": session_id}}
    return planner.invoke(payload, config=config)


def _history_for_session(session_id: str) -> list[dict[str, str]]:
    raw = _SESSIONS.get(session_id, {}).get("messages")
    if not isinstance(raw, list):
        return []
    out: list[dict[str, str]] = []
    for item in raw[-_MAX_SESSION_MESSAGES:]:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            out.append({"role": role, "content": content})
    return out


def _append_session_message(session_id: str, role: str, content: str) -> None:
    if role not in {"user", "assistant"}:
        return
    s = _SESSIONS.setdefault(session_id, {})
    msgs = s.setdefault("messages", [])
    if not isinstance(msgs, list):
        msgs = []
        s["messages"] = msgs
    msgs.append({"role": role, "content": content})
    if len(msgs) > _MAX_SESSION_MESSAGES:
        del msgs[: len(msgs) - _MAX_SESSION_MESSAGES]


def _looks_like_retryable_model_error(exc: Exception) -> bool:
    text = str(exc).lower()
    if "provider returned error" in text:
        return True
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


def _is_write_intent(message: str) -> bool:
    return bool(_WRITE_INTENT_RE.search(message or ""))


def _execute_select_sync(sql: str) -> tuple[Optional[str], Optional[str]]:
    err, cleaned = validate_read_only_select(sql)
    if err or cleaned is None:
        return None, err
    try:
        with sync_engine.connect() as conn:
            result = conn.execute(text(cleaned))
            rows = result.mappings().all()
            out = "[]" if not rows else str(rows[:200])
            if len(out) > 50_000:
                out = out[:50_000] + "\n…(truncated)"
            return out, None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def _extract_write_plan(prompt: str) -> dict[str, Any] | None:
    """Extract a deterministic project update plan from plain English."""
    text_l = (prompt or "").lower()
    if "project" not in text_l:
        return None

    name_match = _PROJECT_QUOTED_RE.search(prompt) or _PROJECT_FALLBACK_RE.search(prompt)
    project_name = (name_match.group(1).strip() if name_match else "").strip()
    status_match = _STATUS_RE.search(prompt)
    priority_match = _PRIORITY_RE.search(prompt)

    status_val: str | None = status_match.group(1).lower() if status_match else None
    priority_val: int | None = int(priority_match.group(1)) if priority_match else None

    if not project_name:
        return None

    # Deterministic delete plan
    if _DELETE_INTENT_RE.search(prompt):
        return {
            "kind": "project_delete",
            "project_name": project_name,
        }

    # Deterministic create plan
    if _CREATE_INTENT_RE.search(prompt):
        description_match = _DESCRIPTION_RE.search(prompt)
        description_val = description_match.group(1).strip() if description_match else None
        return {
            "kind": "project_create",
            "project_name": project_name,
            "status": status_val or "planned",
            "priority": priority_val if priority_val is not None else 1,
            "description": description_val,
        }

    if status_val is None and priority_val is None:
        return None
    if priority_val is not None and not (1 <= priority_val <= 10):
        return None

    return {
        "kind": "project_update",
        "project_name": project_name,
        "status": status_val,
        "priority": priority_val,
    }


def _build_update_preview_sql(plan: dict[str, Any]) -> str:
    kind = plan.get("kind")
    if kind == "project_create":
        safe_name = str(plan.get("project_name", "")).replace("'", "''")
        safe_desc = str(plan.get("description") or "").replace("'", "''")
        status_val = str(plan.get("status") or "planned")
        priority_val = int(plan.get("priority") or 1)
        desc_sql = f"'{safe_desc}'" if safe_desc else "NULL"
        return (
            "INSERT INTO projects (name, description, status, priority)\n"
            f"VALUES ('{safe_name}', {desc_sql}, '{status_val}', {priority_val});"
        )
    if kind == "project_delete":
        safe_name = str(plan.get("project_name", "")).replace("'", "''")
        return "DELETE FROM projects\n" + f"WHERE name = '{safe_name}';"
    if kind != "project_update":
        return "-- preview unavailable"
    set_parts: list[str] = []
    if plan.get("status") is not None:
        set_parts.append(f"status = '{plan['status']}'")
    if plan.get("priority") is not None:
        set_parts.append(f"priority = {int(plan['priority'])}")
    safe_name = str(plan.get("project_name", "")).replace("'", "''")
    return (
        "UPDATE projects\n"
        f"SET {', '.join(set_parts)}\n"
        f"WHERE name = '{safe_name}';"
    )


def _execute_project_update_sync(plan: dict[str, Any]) -> tuple[str | None, str | None]:
    kind = plan.get("kind")
    if kind == "project_create":
        project_name = str(plan.get("project_name") or "").strip()
        if not project_name:
            return None, "Missing project_name in write plan."
        status_val = str(plan.get("status") or "planned").lower()
        if status_val not in {"planned", "ongoing", "completed"}:
            return None, "Invalid status in create plan."
        priority_val = int(plan.get("priority") or 1)
        if priority_val < 1 or priority_val > 10:
            return None, "Priority must be between 1 and 10."
        description_val = str(plan.get("description") or "").strip() or None

        check_stmt = text("SELECT id FROM projects WHERE name = :project_name LIMIT 1")
        insert_stmt = text(
            """
            INSERT INTO projects (name, description, status, priority)
            VALUES (:project_name, :description, :status, :priority)
            RETURNING id, name, status, priority
            """
        )
        try:
            with sync_engine.begin() as conn:
                existing = conn.execute(check_stmt, {"project_name": project_name}).mappings().first()
                if existing is not None:
                    return None, f"Project '{project_name}' already exists."
                row = conn.execute(
                    insert_stmt,
                    {
                        "project_name": project_name,
                        "description": description_val,
                        "status": status_val,
                        "priority": priority_val,
                    },
                ).mappings().first()
                if row is None:
                    return None, "Create failed."
                return (
                    f"Project created successfully (id={row['id']}, name={row['name']}, "
                    f"status={row['status']}, priority={row['priority']}).",
                    None,
                )
        except Exception as exc:  # noqa: BLE001
            return None, str(exc)

    if kind == "project_delete":
        project_name = str(plan.get("project_name") or "").strip()
        if not project_name:
            return None, "Missing project_name in write plan."
        stmt = text(
            """
            DELETE FROM projects
            WHERE name = :project_name
            RETURNING id, name
            """
        )
        try:
            with sync_engine.begin() as conn:
                row = conn.execute(stmt, {"project_name": project_name}).mappings().first()
                if row is None:
                    return None, f"No project found with name '{project_name}'."
                return f"Project deleted successfully (id={row['id']}, name={row['name']}).", None
        except Exception as exc:  # noqa: BLE001
            return None, str(exc)

    if kind != "project_update":
        return None, "Unsupported write plan."
    project_name = str(plan.get("project_name") or "").strip()
    status_val = plan.get("status")
    priority_val = plan.get("priority")
    if not project_name:
        return None, "Missing project_name in write plan."

    set_parts: list[str] = []
    params: dict[str, object] = {"project_name": project_name}
    if status_val is not None:
        set_parts.append("status = :status")
        params["status"] = str(status_val)
    if priority_val is not None:
        set_parts.append("priority = :priority")
        params["priority"] = int(priority_val)
    if not set_parts:
        return None, "No fields to update."

    stmt = text(
        f"""
        UPDATE projects
        SET {", ".join(set_parts)}
        WHERE name = :project_name
        RETURNING id, name, status, priority
        """
    )
    try:
        with sync_engine.begin() as conn:
            row = conn.execute(stmt, params).mappings().first()
            if row is None:
                return None, f"No project found with name '{project_name}'."
            return (
                f"Project updated successfully (id={row['id']}, name={row['name']}, "
                f"status={row['status']}, priority={row['priority']}).",
                None,
            )
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


@router.get("/health")
async def deepagent_health(_: User = Depends(get_current_user)) -> dict:
    return {"status": "ok", "service": "sandy-lab-native-agent"}


@router.post("/chat")
async def deepagent_chat(
    body: AgentChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    session_id = (body.session_id or "").strip() or str(uuid.uuid4())[:8]
    prompt = (body.message or "").strip()
    if not prompt:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "message is required")
    _append_session_message(session_id, "user", prompt)

    # Automatic human-in-the-loop for write intent prompts:
    # do not execute the planner before explicit approval.
    if _is_write_intent(prompt):
        plan = _extract_write_plan(prompt)
        trace = [
            {
                "step": 1,
                "speaker": "planner",
                "content": "Detected write/update intent and paused for human approval before execution.",
            }
        ]
        _SESSIONS[session_id] = {
            "user_id": user.id,
            "pending_kind": "write_intent",
            "original_prompt": prompt,
            "write_plan": plan,
            "messages": _history_for_session(session_id),
        }
        preview = {
            "type": "write_intent",
            "message": "Potential database update detected. Review and approve before execution.",
            "requested_action": prompt[:1200],
            "planned_mutation": plan,
            "preview_sql": _build_update_preview_sql(plan) if plan else None,
        }
        db.add(
            AIActionLog(
                action_type="agent_chat",
                description=prompt[:2000],
                user_id=user.id,
                agent="planner",
                action_metadata={
                    "session_id": session_id,
                    "prompt_chars": len(prompt),
                    "pending_approval": True,
                    "approval_type": "write_intent",
                    "orchestration_trace": trace,
                },
            ),
        )
        await db.commit()
        return {
            "session_id": session_id,
            "response": "A write/update operation was detected and is waiting for your approval.",
            "pending_approval": True,
            "approval_details": preview,
            "orchestration_trace": trace,
        }

    before_id = await db.scalar(
        select(func.max(AgentSqlProposal.id)).where(AgentSqlProposal.user_id == user.id),
    )
    token = agent_request_user_id.set(user.id)
    settings = get_settings()
    attempts = max(1, len(settings.openrouter_model_pool()))
    try:
        last_exc: Exception | None = None
        result = None
        prior_messages = _history_for_session(session_id)
        for attempt in range(attempts):
            model_id = current_model_id()
            try:
                planner_messages = prior_messages + [{"role": "user", "content": prompt}]
                result = await run_in_threadpool(_invoke_planner, planner_messages, session_id)
                break
            except Exception as exc:  # noqa: BLE001
                last_exc = exc
                if not _looks_like_retryable_model_error(exc) or attempt == attempts - 1:
                    raise
                nxt = rotate_model()
                _log.warning(
                    "agent.chat: model error on %s, rotating to %s (%s/%s): %s",
                    model_id,
                    nxt,
                    attempt + 2,
                    attempts,
                    exc,
                )
        if result is None and last_exc is not None:
            raise last_exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(exc)) from exc
    finally:
        agent_request_user_id.reset(token)

    trace = _extract_orchestration_trace(result)
    response_text = _extract_response_text(result)
    if not response_text.strip():
        response_text = _fallback_response_from_trace(trace)
    _append_session_message(session_id, "assistant", response_text)
    pending = await db.execute(
        select(AgentSqlProposal)
        .where(AgentSqlProposal.user_id == user.id, AgentSqlProposal.status == "pending")
        .where(AgentSqlProposal.id > int(before_id or 0))
        .order_by(AgentSqlProposal.id.desc())
        .limit(1),
    )
    proposal = pending.scalar_one_or_none()

    log = AIActionLog(
        action_type="agent_chat",
        description=prompt[:2000],
        user_id=user.id,
        agent="planner",
        action_metadata={
            "session_id": session_id,
            "prompt_chars": len(prompt),
            "response_text": response_text[:20000],
            "pending_approval": proposal is not None,
            "orchestration_trace": trace[:200],
        },
    )
    db.add(log)
    await db.commit()

    approval_details = None
    if proposal is not None:
        _SESSIONS[session_id] = {"proposal_id": proposal.id, "user_id": user.id}
        approval_details = {
            "proposal_id": proposal.id,
            "tool_name": "propose_select_query",
            "sql": proposal.sql_text,
            "rationale": proposal.rationale,
        }
        if not response_text:
            response_text = "A database read proposal requires your approval."

    return {
        "session_id": session_id,
        "response": response_text,
        "pending_approval": proposal is not None,
        "approval_details": approval_details,
        "orchestration_trace": trace[:200],
    }


@router.post("/approve")
async def deepagent_approve(
    body: AgentApproveRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    session = _SESSIONS.get(body.session_id, {})
    if session.get("pending_kind") == "write_intent":
        if session.get("user_id") != user.id and user.role != "admin":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your approval request")
        if not body.approved:
            _append_session_message(body.session_id, "assistant", "Rejected. No update was executed.")
            db.add(
                AIActionLog(
                    action_type="agent_approval",
                    description="Rejected write intent request",
                    user_id=user.id,
                    agent="planner",
                    action_metadata={"session_id": body.session_id, "approved": False, "approval_type": "write_intent"},
                ),
            )
            await db.commit()
            return {"status": "rejected", "response": "Rejected. No update was executed."}

        write_plan = session.get("write_plan")
        if isinstance(write_plan, dict):
            ok_text, err_text = await run_in_threadpool(_execute_project_update_sync, write_plan)
            trace = [
                {"step": 1, "speaker": "planner", "content": "Write intent approved by human."},
                {
                    "step": 2,
                    "speaker": "database-agent",
                    "content": f"Executing planned mutation for project '{write_plan.get('project_name')}'.",
                },
                {
                    "step": 3,
                    "speaker": "database-agent",
                    "content": ok_text if err_text is None else f"Execution failed: {err_text}",
                },
            ]
            resp = ok_text if err_text is None else f"Approval failed: {err_text}"
            db.add(
                AIActionLog(
                    action_type="agent_approval",
                    description="Approved write intent request",
                    user_id=user.id,
                    agent="planner",
                    action_metadata={
                        "session_id": body.session_id,
                        "approved": True,
                        "approval_type": "write_intent",
                        "planned_mutation": write_plan,
                        "orchestration_trace": trace,
                    },
                ),
            )
            await db.commit()
            _append_session_message(body.session_id, "assistant", resp)
            return {"status": "approved" if err_text is None else "failed", "response": resp, "orchestration_trace": trace}

        original_prompt = str(session.get("original_prompt") or "")
        token = agent_request_user_id.set(user.id)
        try:
            prior_messages = _history_for_session(body.session_id)
            planner_messages = prior_messages + [{"role": "user", "content": original_prompt}]
            result = await run_in_threadpool(_invoke_planner, planner_messages, body.session_id)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, str(exc)) from exc
        finally:
            agent_request_user_id.reset(token)
        response_text = _extract_response_text(result) or "Approved and executed."
        _append_session_message(body.session_id, "assistant", response_text)
        trace = _extract_orchestration_trace(result)
        db.add(
            AIActionLog(
                action_type="agent_approval",
                description="Approved write intent request",
                user_id=user.id,
                agent="planner",
                action_metadata={
                    "session_id": body.session_id,
                    "approved": True,
                    "approval_type": "write_intent",
                    "orchestration_trace": trace[:200],
                },
            ),
        )
        await db.commit()
        return {"status": "approved", "response": response_text, "orchestration_trace": trace[:200]}

    proposal_id = int(body.action_id or session.get("proposal_id") or 0)
    if proposal_id <= 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No pending approval for this session")

    proposal = await db.get(AgentSqlProposal, proposal_id)
    if proposal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found")
    if user.role != "admin" and proposal.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your proposal")
    if proposal.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Proposal is not pending")

    if body.approved:
        result_text, err = await run_in_threadpool(_execute_select_sync, proposal.sql_text)
        if err:
            proposal.status = "rejected"
            proposal.error_text = err
            response = f"Approval failed: {err}"
        else:
            proposal.status = "approved"
            proposal.result_text = result_text
            preview = (result_text or "")[:1500]
            response = f"Approved and executed proposal #{proposal.id}.\n\nResult preview:\n{preview}"
            _append_session_message(body.session_id, "assistant", response)
    else:
        proposal.status = "rejected"
        response = f"Rejected proposal #{proposal.id}."
        _append_session_message(body.session_id, "assistant", response)

    proposal.decided_at = datetime.utcnow()
    db.add(
        AIActionLog(
            action_type="agent_approval",
            description=response[:2000],
            user_id=user.id,
            agent="database-agent",
            action_metadata={
                "session_id": body.session_id,
                "proposal_id": proposal.id,
                "approved": body.approved,
            },
        ),
    )
    await db.commit()
    return {"status": "approved" if body.approved else "rejected", "response": response}


@router.get("/monitoring")
async def deepagent_monitoring(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    total_actions = int((await db.scalar(select(func.count()).select_from(AIActionLog))) or 0)
    pending_approvals = int(
        (await db.scalar(select(func.count()).select_from(AgentSqlProposal).where(AgentSqlProposal.status == "pending")))
        or 0
    )
    token_totals = await db.execute(
        select(
            func.coalesce(func.sum(AIActionLog.tokens), 0),
            func.coalesce(func.sum(AIActionLog.cost_usd), 0),
        ),
    )
    total_tokens, total_cost = token_totals.one()

    recent = await db.execute(select(AIActionLog).order_by(AIActionLog.id.desc()).limit(500))
    actions = list(recent.scalars().all())
    by_agent: dict[str, int] = {}
    by_tool: dict[str, int] = {}
    for row in actions:
        if row.agent:
            by_agent[row.agent] = by_agent.get(row.agent, 0) + 1
        md = row.action_metadata or {}
        tool_name = md.get("tool") or md.get("tool_name")
        if isinstance(tool_name, str) and tool_name:
            by_tool[tool_name] = by_tool.get(tool_name, 0) + 1

    approval_counts = await db.execute(
        select(
            func.count().label("total"),
            func.sum(func.case((AgentSqlProposal.status == "approved", 1), else_=0)).label("approved"),
            func.sum(func.case((AgentSqlProposal.status == "rejected", 1), else_=0)).label("rejected"),
            func.sum(func.case((AgentSqlProposal.status == "pending", 1), else_=0)).label("pending"),
        ),
    )
    a_total, a_approved, a_rejected, a_pending = approval_counts.one()

    return {
        "total_actions": total_actions,
        "actions_by_agent": by_agent,
        "actions_by_tool": by_tool,
        "token_usage": {
            "total_tokens": int(total_tokens or 0),
            "cost_usd": float(total_cost or 0),
        },
        "pending_approvals": pending_approvals,
        "approval_stats": {
            "total_requests": int(a_total or 0),
            "approved": int(a_approved or 0),
            "rejected": int(a_rejected or 0),
            "pending": int(a_pending or 0),
        },
    }


@router.get("/actions")
async def deepagent_actions(
    agent_name: Optional[str] = None,
    action_type: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    q = select(AIActionLog).order_by(AIActionLog.id.desc()).limit(max(1, min(limit, 200)))
    if agent_name:
        q = q.where(AIActionLog.agent == agent_name)
    if action_type:
        q = q.where(AIActionLog.action_type == action_type)
    result = await db.execute(q)
    rows = list(result.scalars().all())
    actions = [
        {
            "id": r.id,
            "timestamp": r.created_at.isoformat() if r.created_at else None,
            "agent_name": r.agent,
            "action_type": r.action_type,
            "description": r.description,
            "metadata": r.action_metadata,
            "status": "completed",
        }
        for r in rows
    ]
    return {"total": len(actions), "actions": actions}

