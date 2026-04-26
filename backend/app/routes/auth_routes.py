import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import authenticate_user, create_access_token, get_current_user, hash_password
from app.config import get_settings
from app.db import get_db
from app.models import User
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _client_host(request: Request) -> str:
    if request.client is None:
        return "unknown"
    return request.client.host or "unknown"


@router.post("/token", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    host = _client_host(request)
    logger.info("auth.route: POST /token attempt email=%r client=%s", body.email, host)
    user = await authenticate_user(db, body.email, body.password)
    if user is None:
        logger.warning(
            "auth.route: POST /token failed email=%r client=%s",
            body.email,
            host,
        )
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    token = create_access_token(subject=str(user.id), role=user.role)
    logger.info(
        "auth.route: POST /token ok user_id=%s email=%r role=%r client=%s",
        user.id,
        user.email,
        user.role,
        host,
    )
    return TokenResponse(access_token=token)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    body: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    host = _client_host(request)
    logger.info("auth.route: POST /register attempt email=%r client=%s", body.email, host)
    settings = get_settings()
    if not settings.allow_open_registration:
        logger.warning("auth.route: POST /register blocked (open registration off) client=%s", host)
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Open registration is disabled")
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        logger.warning("auth.route: POST /register conflict email=%r client=%s", body.email, host)
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    count = await db.scalar(select(func.count()).select_from(User))
    role = "admin" if (count or 0) == 0 else "researcher"

    user = User(
        email=body.email.strip().lower(),
        full_name=body.full_name,
        role=role,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=str(user.id), role=user.role)
    logger.info(
        "auth.route: POST /register ok user_id=%s email=%r role=%r client=%s",
        user.id,
        user.email,
        user.role,
        host,
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserRead)
async def read_me(
    request: Request,
    user: User = Depends(get_current_user),
) -> User:
    logger.debug(
        "auth.route: GET /me ok user_id=%s email=%r client=%s",
        user.id,
        user.email,
        _client_host(request),
    )
    return user
