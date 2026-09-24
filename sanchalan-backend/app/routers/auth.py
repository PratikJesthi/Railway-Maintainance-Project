from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlmodel import Session, select

from .. import models
from ..config import settings
from ..database import get_session
from ..schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)
from ..security import (
    create_access_token,
    get_current_user,
    hash_password,
    user_departments,
    verify_password,
)

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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_session)):
    emp_id = payload.employee_id.strip()
    if not emp_id or not payload.name.strip() or not payload.password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All fields are required")

    existing = session.exec(select(models.User).where(models.User.employee_id == emp_id)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID is already registered")

    valid_roles = ("requester", "controller", "approver", "viewer")
    role = payload.role.lower() if payload.role else "requester"
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role specified. Must be one of: {', '.join(valid_roles)}",
        )

    depts = [d.upper() for d in payload.departments] if payload.departments else ["ENG"]

    user = models.User(
        employee_id=emp_id,
        name=payload.name.strip(),
        hashed_password=hash_password(payload.password),
        role=role,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    for dept_code in depts:
        session.add(models.UserDepartment(user_id=user.id, dept=dept_code))
    session.commit()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=_to_user_out(session, user))


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, session: Session = Depends(get_session)):
    emp_id = payload.employee_id.strip()
    user = session.exec(select(models.User).where(models.User.employee_id == emp_id)).first()
    if not user:
        return ForgotPasswordResponse(
            message="If an account exists for this Employee ID, password reset authorization instructions have been dispatched.",
        )

    reset_token = create_access_token({"sub": str(user.id), "type": "reset"}, expires_minutes=15)

    # Print high-visibility Admin Dispatch Banner to server logs for demo/testing
    print(
        f"\n=======================================================\n"
        f"🔑 [ADMIN DISPATCH] RESET TOKEN GENERATED\n"
        f"Employee ID: {user.employee_id} ({user.name})\n"
        f"Reset Authorization Token: {reset_token}\n"
        f"=======================================================\n",
        flush=True,
    )

    # Write AuditEntry so higher officials logged into SANCHALAN can view/dispatch tokens from Audit Log
    try:
        t_str = datetime.now(timezone.utc).strftime("%a %H:%M")
        audit_entry = models.AuditEntry(
            t=t_str,
            by="Control Admin",
            action="RESET TOKEN ISSUED",
            detail=f"Token for {user.employee_id}: {reset_token}",
            type="warn",
        )
        session.add(audit_entry)
        session.commit()
    except Exception as exc:
        print(f"Audit log warning: {exc}")

    return ForgotPasswordResponse(
        message="Password reset request submitted. Contact higher official / check server logs or Audit Log for your reset token.",
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, session: Session = Depends(get_session)):
    emp_id = payload.employee_id.strip()
    user = session.exec(select(models.User).where(models.User.employee_id == emp_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee ID not found")

    if not payload.reset_token or len(payload.reset_token.strip()) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset authorization token is required")

    try:
        token_payload = jwt.decode(payload.reset_token.strip(), settings.secret_key, algorithms=[settings.jwt_algorithm])
        sub = token_payload.get("sub")
        token_type = token_payload.get("type")
        if sub != str(user.id) or token_type != "reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or mismatching reset token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    if not payload.new_password or len(payload.new_password.strip()) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password cannot be empty")

    user.hashed_password = hash_password(payload.new_password)
    session.add(user)
    session.commit()

    return MessageResponse(message="Password reset successfully. You can now sign in with your new password.")



@router.get("/me", response_model=UserOut)
def me(
    current_user: models.User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return _to_user_out(session, current_user)

