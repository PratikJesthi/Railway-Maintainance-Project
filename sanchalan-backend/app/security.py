"""JWT auth + role/department guard. Mirrors the flat style of the rest of app/.

Requires: passlib[bcrypt], python-jose[cryptography], python-multipart
(add to requirements.txt).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from .config import settings
from .database import get_session
from .models import User, UserDepartment

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


def get_current_user(
    token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = session.get(User, int(user_id))
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def user_departments(session: Session, user: User) -> list[str]:
    rows = session.exec(select(UserDepartment).where(UserDepartment.user_id == user.id)).all()
    return [r.dept for r in rows]


def require_departments(*allowed: str):
    """controller/approver pass regardless (all-department); requester/viewer need a dept match."""
    def checker(
        user: User = Depends(get_current_user), session: Session = Depends(get_session)
    ) -> User:
        if user.role in ("controller", "approver"):
            return user
        if set(user_departments(session, user)) & set(allowed):
            return user
        raise HTTPException(status_code=403, detail="Not authorised for this department")
    return checker


def require_role(*allowed: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(status_code=403, detail="Not authorised for this action")
        return user
    return checker
