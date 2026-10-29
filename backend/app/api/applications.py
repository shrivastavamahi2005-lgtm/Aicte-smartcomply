from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.models.entities import Application, ApplicationCourse, Institution, User
from app.schemas.schemas import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    ApplicationWorkflowTransition
)
from app.services.auth_service import get_current_user, require_roles
from app.services.workflow_service import transition_application_stage
from app.services.alert_service import evaluate_deadline_risk
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/applications", tags=["Applications"])

def build_app_response(app: Application) -> ApplicationResponse:
    inst = app.institution
    assigned_name = app.assigned_officer.full_name if app.assigned_officer else None
    return ApplicationResponse(
        id=app.id,
        application_number=app.application_number,
        institution_id=app.institution_id,
        institution_name=inst.name if inst else "N/A",
        institution_code=inst.code if inst else "N/A",
        academic_year=app.academic_year,
        application_type=app.application_type,
        workflow_stage=app.workflow_stage,
        compliance_status=app.compliance_status,
        internal_readiness_score=app.internal_readiness_score,
        deadline=app.deadline,
        assigned_officer_id=app.assigned_officer_id,
        assigned_officer_name=assigned_name,
        decision_notes=app.decision_notes,
        decision_date=app.decision_date,
        created_at=app.created_at,
        updated_at=app.updated_at,
        courses=[
            {
                "id": c.id,
                "application_id": c.application_id,
                "course_name": c.course_name,
                "department": c.department,
                "level": c.level,
                "approved_intake": c.approved_intake,
                "requested_intake": c.requested_intake,
                "faculty_count": c.faculty_count,
                "student_count": c.student_count
            }
            for c in app.courses
        ]
    )

@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    stage: Optional[str] = None,
    app_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    # Scoped access for college admin / faculty
    if current_user.role in ["College Administrator", "Department Coordinator"] and current_user.institution_id:
        query = query.filter(Application.institution_id == current_user.institution_id)

    if stage:
        query = query.filter(Application.workflow_stage == stage)
    if app_type:
        query = query.filter(Application.application_type == app_type)

    apps = query.order_by(Application.created_at.desc()).all()
    return [build_app_response(a) for a in apps]

@router.post("", response_model=ApplicationResponse)
def create_application(
    req: ApplicationCreate,
    current_user: User = Depends(require_roles(["College Administrator"])),
    db: Session = Depends(get_db)
):
    inst = db.query(Institution).filter(Institution.id == req.institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    # Generate sequential application number
    count = db.query(Application).count() + 1
    app_number = f"AICTE-{datetime.now().year}-{inst.code}-{count:03d}"
    default_deadline = datetime.now(timezone.utc) + timedelta(days=30)

    application = Application(
        application_number=app_number,
        institution_id=req.institution_id,
        academic_year=req.academic_year,
        application_type=req.application_type,
        workflow_stage="Draft",
        compliance_status="Not Evaluated",
        internal_readiness_score=0.0,
        deadline=default_deadline,
        created_at=datetime.now(timezone.utc)
    )
    db.add(application)
    db.flush()

    # Add default courses if provided
    if req.courses:
        for c in req.courses:
            course = ApplicationCourse(
                application_id=application.id,
                course_name=c.course_name,
                department=c.department,
                level=c.level,
                approved_intake=c.approved_intake,
                requested_intake=c.requested_intake,
                faculty_count=c.faculty_count,
                student_count=c.student_count
            )
            db.add(course)
    else:
        # Default starter course
        course = ApplicationCourse(
            application_id=application.id,
            course_name="Computer Science & Engineering",
            department="Computer Science",
            level="UG",
            approved_intake=60,
            requested_intake=60,
            faculty_count=4,
            student_count=240
        )
        db.add(course)

    db.commit()

    log_audit_event(
        db=db,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="APPLICATION_CREATED",
        entity_type="Application",
        entity_id=application.id,
        change_summary=f"Created new draft application #{application.application_number} ({application.application_type})."
    )

    return build_app_response(application)

@router.get("/{id}", response_model=ApplicationResponse)
def get_application(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Access control
    if current_user.role in ["College Administrator", "Department Coordinator"]:
        if current_user.institution_id and app.institution_id != current_user.institution_id:
            raise HTTPException(status_code=403, detail="Not authorized to access another institution's application records.")

    return build_app_response(app)

@router.post("/{id}/transition", response_model=ApplicationResponse)
def transition_stage(
    id: int,
    req: ApplicationWorkflowTransition,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = transition_application_stage(
        db=db,
        application_id=id,
        target_stage=req.target_stage,
        actor_user=current_user,
        remarks=req.remarks
    )
    return build_app_response(app)

@router.get("/{id}/risk")
def get_application_risk(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return evaluate_deadline_risk(db, id)
