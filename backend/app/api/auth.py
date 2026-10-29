from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.models.entities import User
from app.schemas.schemas import Token, LoginRequest, PasswordResetRequest, UserResponse
from app.services.auth_service import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")

    access_token = create_access_token(
        subject=user.email,
        role=user.role,
        institution_id=user.institution_id
    )

    log_audit_event(
        db=db,
        actor_email=user.email,
        actor_role=user.role,
        action="USER_LOGIN_SUCCESS",
        entity_type="User",
        entity_id=user.id,
        change_summary="User authenticated successfully."
    )

    inst_name = user.institution.name if user.institution else None

    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        institution_id=user.institution_id,
        institution_name=inst_name,
        department=user.department,
        is_active=user.is_active
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_resp
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    inst_name = current_user.institution.name if current_user.institution else None
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        institution_id=current_user.institution_id,
        institution_name=inst_name,
        department=current_user.department,
        is_active=current_user.is_active
    )

@router.post("/reset-password")
def reset_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid current password")

    user.hashed_password = hash_password(req.new_password)
    db.commit()

    log_audit_event(
        db=db,
        actor_email=user.email,
        actor_role=user.role,
        action="PASSWORD_RESET_SUCCESS",
        entity_type="User",
        entity_id=user.id,
        change_summary="Password changed via secure hash update."
    )

    return {"message": "Password updated successfully"}
