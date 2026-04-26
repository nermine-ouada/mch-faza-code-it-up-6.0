from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_db
from app.models import InventoryItem, InventoryTransaction, User
from app.schemas import (
    InventoryCreate,
    InventoryRead,
    InventoryTransactionCreate,
    InventoryUpdate,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=List[InventoryRead])
async def list_inventory(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> List[InventoryItem]:
    result = await db.execute(select(InventoryItem).order_by(InventoryItem.id.desc()))
    return list(result.scalars().all())


@router.post("", response_model=InventoryRead, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    body: InventoryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> InventoryItem:
    row = InventoryItem(
        name=body.name,
        category=body.category,
        quantity=body.quantity,
        unit=body.unit,
        min_required=body.min_required,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.post("/transactions", status_code=status.HTTP_201_CREATED)
async def create_inventory_transaction(
    body: InventoryTransactionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    if body.txn_type not in ("in", "out", "adjust", "expired"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid txn_type")
    parent = await db.get(InventoryItem, body.inventory_id)
    if parent is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")
    row = InventoryTransaction(
        inventory_id=body.inventory_id,
        change_amount=body.change_amount,
        reason=body.reason,
        type=body.txn_type,
        user_id=user.id,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return {"id": row.id, "inventory_id": body.inventory_id}


@router.get("/{item_id}", response_model=InventoryRead)
async def get_inventory_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> InventoryItem:
    row = await db.get(InventoryItem, item_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return row


@router.patch("/{item_id}", response_model=InventoryRead)
async def update_inventory_item(
    item_id: int,
    body: InventoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> InventoryItem:
    row = await db.get(InventoryItem, item_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    row = await db.get(InventoryItem, item_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    await db.execute(delete(InventoryItem).where(InventoryItem.id == item_id))
    await db.commit()
