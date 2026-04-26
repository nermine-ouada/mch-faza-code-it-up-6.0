from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_db
from app.models import Event, User
from app.schemas import EventCreate, EventRead, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventRead])
async def list_events(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> List[Event]:
    result = await db.execute(select(Event).order_by(Event.start_at.asc(), Event.id.asc()))
    return list(result.scalars().all())


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    body: EventCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Event:
    row = Event(
        title=body.title,
        description=body.description,
        start_at=body.start_at,
        end_at=body.end_at,
        all_day=body.all_day,
        owner_id=user.id,
        project_id=body.project_id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: int,
    body: EventUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Event:
    row = await db.get(Event, event_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    row = await db.get(Event, event_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    await db.execute(delete(Event).where(Event.id == event_id))
    await db.commit()
