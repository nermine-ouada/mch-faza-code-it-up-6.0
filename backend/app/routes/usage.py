from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_db
from app.models import AIActionLog, User
from app.schemas import AIActionRead

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/activity", response_model=List[AIActionRead])
async def list_usage_activity(
    action_type: Optional[str] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> List[AIActionLog]:
    """Recent rows from ai_actions_log (e.g. chat_stream events for AI monitoring)."""
    q = select(AIActionLog).order_by(AIActionLog.id.desc()).limit(max(1, min(limit, 300)))
    if action_type:
        q = q.where(AIActionLog.action_type == action_type)
    result = await db.execute(q)
    return list(result.scalars().all())
