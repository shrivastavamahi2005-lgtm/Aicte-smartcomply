from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.core.database import get_db
from app.models.entities import Alert, User
from app.schemas.schemas import AlertResponse
from app.services.auth_service import get_current_user
from app.services.alert_service import acknowledge_alert

router = APIRouter(prefix="/alerts", tags=["Alerts & Escalations"])

@router.get("", response_model=List[AlertResponse])
def get_user_alerts(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).filter(
        or_(
            Alert.user_id == current_user.id,
            Alert.target_role == current_user.role,
            Alert.target_role.is_(None)
        )
    )
    if unread_only:
        query = query.filter(Alert.is_read == False)

    alerts = query.order_by(Alert.created_at.desc()).limit(50).all()
    return alerts

@router.put("/{id}/read", response_model=AlertResponse)
def mark_alert_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return alert

@router.put("/{id}/acknowledge", response_model=AlertResponse)
def acknowledge(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = acknowledge_alert(db, id, current_user)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
