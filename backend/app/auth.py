import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.models import User

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except ValueError as exc:
        logger.warning("auth.verify: invalid stored bcrypt hash (%s)", exc)
        return False


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(
        plain_password.encode("utf-8"),
        bcrypt.gensalt(rounds=12),
    ).decode("utf-8")


def create_access_token(*, subject: str, role: str) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        logger.info("auth.login: no user for email=%r", email)
        return None
    if not verify_password(password, user.password_hash):
        logger.info("auth.login: bad password for user_id=%s email=%r", user.id, email)
        return None
    logger.debug("auth.login: password ok for user_id=%s", user.id)
    return user


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    settings = get_settings()

    if settings.skip_auth:
        if creds and creds.scheme.lower() == "bearer" and creds.credentials:
            try:
                payload = jwt.decode(
                    creds.credentials,
                    settings.jwt_secret,
                    algorithms=[settings.jwt_algorithm],
                )
                sub = payload.get("sub")
                if sub is not None:
                    user = await db.get(User, int(sub))
                    if user is not None:
                        logger.debug(
                            "auth.me: skip_auth mode, JWT user_id=%s email=%r",
                            user.id,
                            user.email,
                        )
                        return user
            except (JWTError, ValueError, TypeError) as exc:
                logger.debug(
                    "auth.me: skip_auth JWT ignored (%s: %s), using fallback user",
                    type(exc).__name__,
                    exc,
                )
        result = await db.execute(select(User).order_by(User.id.asc()).limit(1))
        fallback = result.scalar_one_or_none()
        if fallback is None:
            logger.error("auth.me: skip_auth but no users in database")
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "No users in database; run setup_db.py",
            )
        logger.warning(
            "auth.me: skip_auth fallback user_id=%s email=%r (no/invalid Bearer)",
            fallback.id,
            fallback.email,
        )
        return fallback

    if creds is None or creds.scheme.lower() != "bearer":
        logger.debug("auth.me: missing or non-bearer Authorization header")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = jwt.decode(
            creds.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        sub = payload.get("sub")
        if sub is None:
            logger.warning("auth.me: JWT payload missing 'sub'")
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
        user = await db.get(User, int(sub))
        if user is None:
            logger.warning("auth.me: JWT sub=%r resolved to no user row", sub)
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
        logger.debug("auth.me: ok user_id=%s email=%r role=%r", user.id, user.email, user.role)
        return user
    except JWTError as exc:
        logger.warning("auth.me: JWT decode failed (%s: %s)", type(exc).__name__, exc)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token") from exc


def require_role(*allowed: str):
    allowed_set = set(allowed)

    async def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_set:
            logger.warning(
                "auth.role: denied user_id=%s role=%r need one of %s",
                user.id,
                user.role,
                sorted(allowed_set),
            )
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return _dep
