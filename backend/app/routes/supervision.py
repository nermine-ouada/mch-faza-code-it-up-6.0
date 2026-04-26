from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.agents.tools.db_tools import validate_read_only_select
from app.auth import get_current_user
from app.db import get_db, sync_engine
from app.models import AgentSqlProposal, User
from app.schemas import AgentSqlProposalRead


router = APIRouter(prefix="/supervision", tags=["supervision"])


def _execute_select_sync(sql: str) -> tuple[Optional[str], Optional[str]]:
    err, cleaned = validate_read_only_select(sql)
    if err or cleaned is None:
        return None, err
    try:
        with sync_engine.connect() as conn:
            result = conn.execute(text(cleaned))
            rows = result.mappings().all()
            if not rows:
                out = "[]"
            else:
                out = str(rows[:200])
            if len(out) > 50_000:
                out = out[:50_000] + "\n…(truncated)"
            return out, None
    except Exception as exc:  # noqa: BLE001 — surface DB errors to reviewer
        return None, str(exc)


@router.get("/sql-proposals", response_model=List[AgentSqlProposalRead])
async def list_sql_proposals(
    status_filter: Optional[str] = None,
    limit: int = 80,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> List[AgentSqlProposal]:
    q = select(AgentSqlProposal).order_by(AgentSqlProposal.id.desc()).limit(max(1, min(limit, 200)))
    if user.role != "admin":
        q = q.where(AgentSqlProposal.user_id == user.id)
    if status_filter in ("pending", "approved", "rejected"):
        q = q.where(AgentSqlProposal.status == status_filter)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/sql-proposals/{proposal_id}/approve", response_model=AgentSqlProposalRead)
async def approve_sql_proposal(
    proposal_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AgentSqlProposal:
    prop = await db.get(AgentSqlProposal, proposal_id)
    if prop is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found")
    if user.role != "admin" and prop.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your proposal")
    if prop.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Proposal is not pending")

    # Re-validate and persist normalized SQL so previously stored proposals
    # with MySQL-ish syntax or hallucinated aliases can still be approved safely.
    v_err, cleaned = validate_read_only_select(prop.sql_text)
    if v_err or cleaned is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, v_err or "Invalid SQL proposal")
    prop.sql_text = cleaned

    result_text, err = await run_in_threadpool(_execute_select_sync, cleaned)
    now = datetime.utcnow()
    if err:
        prop.error_text = err
        prop.status = "rejected"
    else:
        prop.result_text = result_text
        prop.status = "approved"
    prop.decided_at = now
    await db.commit()
    await db.refresh(prop)
    return prop


@router.post("/sql-proposals/{proposal_id}/reject", response_model=AgentSqlProposalRead)
async def reject_sql_proposal(
    proposal_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AgentSqlProposal:
    prop = await db.get(AgentSqlProposal, proposal_id)
    if prop is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Proposal not found")
    if user.role != "admin" and prop.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your proposal")
    if prop.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Proposal is not pending")

    prop.status = "rejected"
    prop.decided_at = datetime.utcnow()
    await db.commit()
    await db.refresh(prop)
    return prop
