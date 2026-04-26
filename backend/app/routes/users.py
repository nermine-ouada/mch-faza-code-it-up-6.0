from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, hash_password, require_role
from app.db import get_db
from app.models import User
from app.schemas import UserAdminCreate, UserAdminUpdate, UserRead
from app.schemas import UserSelfUpdate

router = APIRouter(prefix="/users", tags=["users"])
ALLOWED_ROLES = {"admin", "researcher", "inventory", "viewer"}


@router.get("", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> List[User]:
    result = await db.execute(select(User).order_by(User.id.asc()))
    return list(result.scalars().all())


@router.patch("/me", response_model=UserRead)
async def update_me(
    body: UserSelfUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> User:
    if body.full_name is not None:
        user.full_name = body.full_name
    await db.commit()
    await db.refresh(user)
    return user


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserAdminCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> User:
    role = body.role.strip().lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid role")
    email = body.email.strip().lower()
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already exists")
    row = User(
        email=email,
        full_name=body.full_name,
        role=role,
        password_hash=hash_password(body.password),
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    body: UserAdminUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> User:
    row = await db.get(User, user_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if body.role is not None:
        role = body.role.strip().lower()
        if role not in ALLOWED_ROLES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid role")
        if row.id == admin.id and role != "admin":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Admin cannot remove own admin role")
        row.role = role
    if body.full_name is not None:
        row.full_name = body.full_name
    if body.password:
        row.password_hash = hash_password(body.password)

    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
) -> None:
    row = await db.get(User, user_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if row.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Admin cannot delete own account")
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()

