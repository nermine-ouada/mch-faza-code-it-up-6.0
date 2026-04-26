from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_db
from app.models import AIActionLog, AgentTask, User
from app.schemas import AgentTaskRead, AIActionRead

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/tasks", response_model=List[AgentTaskRead])
async def list_recent_tasks(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> List[AgentTask]:
    q = select(AgentTask).order_by(AgentTask.id.desc()).limit(max(1, min(limit, 200)))
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/actions", response_model=List[AIActionRead])
async def list_recent_actions(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> List[AIActionLog]:
    q = select(AIActionLog).order_by(AIActionLog.id.desc()).limit(max(1, min(limit, 200)))
    result = await db.execute(q)
    return list(result.scalars().all())
