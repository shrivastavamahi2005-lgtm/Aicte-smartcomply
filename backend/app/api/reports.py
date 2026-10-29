from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import AuditEvent, Institution, User
from app.schemas.schemas import (
    DashboardMetricsResponse, AuditEventResponse, InstitutionResponse
)
from app.services.auth_service import get_current_user
from app.services.report_service import get_dashboard_metrics, generate_applications_csv

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard-metrics", response_model=DashboardMetricsResponse)
def get_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_dashboard_metrics(db, current_user)

@router.get("/export-csv")
def export_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    csv_data = generate_applications_csv(db, current_user)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aicte_smartcomply_applications.csv"}
    )

@router.get("/audit-trail", response_model=List[AuditEventResponse])
def get_audit_trail(
    limit: int = 100,
    actor: Optional[str] = None,
    action: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if actor:
        query = query.filter(AuditEvent.actor_email.contains(actor))
    if action:
        query = query.filter(AuditEvent.action.contains(action))

    events = query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return events

@router.get("/institutions", response_model=List[InstitutionResponse])
def get_institutions(db: Session = Depends(get_db)):
    return db.query(Institution).all()
