from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from .. import models
from ..database import get_session
from ..schemas import LoginRequest, TokenResponse, UserOut
from ..security import create_access_token, get_current_user, user_departments, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_user_out(session: Session, user: models.User) -> UserOut:
    return UserOut(
        id=user.id,
        employee_id=user.employee_id,
        name=user.name,
        role=user.role,
        departments=user_departments(session, user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(
        select(models.User).where(models.User.employee_id == payload.employee_id)
    ).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid employee ID or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=_to_user_out(session, user))


@router.get("/me", response_model=UserOut)
def me(
    current_user: models.User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return _to_user_out(session, current_user)
