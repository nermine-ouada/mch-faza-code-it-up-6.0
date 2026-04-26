from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_db
from app.models import ExperimentLog, User
from app.schemas import ExperimentCreate, ExperimentRead, ExperimentUpdate

router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.get("", response_model=List[ExperimentRead])
async def list_experiments(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> List[ExperimentLog]:
    result = await db.execute(select(ExperimentLog).order_by(ExperimentLog.id.desc()))
    return list(result.scalars().all())


@router.post("", response_model=ExperimentRead, status_code=status.HTTP_201_CREATED)
async def create_experiment(
    body: ExperimentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExperimentLog:
    row = ExperimentLog(
        project_id=body.project_id,
        result=body.result,
        success=body.success,
        notes=body.notes,
        user_id=user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.get("/{experiment_id}", response_model=ExperimentRead)
async def get_experiment(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ExperimentLog:
    row = await db.get(ExperimentLog, experiment_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experiment not found")
    return row


@router.patch("/{experiment_id}", response_model=ExperimentRead)
async def update_experiment(
    experiment_id: int,
    body: ExperimentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ExperimentLog:
    row = await db.get(ExperimentLog, experiment_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experiment not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experiment(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    row = await db.get(ExperimentLog, experiment_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experiment not found")
    await db.execute(delete(ExperimentLog).where(ExperimentLog.id == experiment_id))
    await db.commit()
