from typing import Optional, List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.entities import (
    Application, Task, TaskComment, ComplianceFinding, User, Alert
)
from app.services.audit_service import log_audit_event

ALLOWED_TRANSITIONS = {
    "Draft": ["Submitted"],
    "Submitted": ["Document Validation", "Returned"],
    "Document Validation": ["Compliance Review", "Clarification Requested", "Resubmission Required"],
    "Compliance Review": ["Officer Review", "Clarification Requested"],
    "Clarification Requested": ["Submitted", "Resubmission Required"],
    "Resubmission Required": ["Submitted"],
    "Officer Review": ["Recommended for Decision", "Clarification Requested", "Returned"],
    "Recommended for Decision": ["Approved", "Rejected", "Returned"],
    "Approved": ["Closed"],
    "Rejected": ["Closed"],
    "Returned": ["Draft"],
    "Closed": []
}

ROLE_PERMISSIONS = {
    "College Administrator": ["Submitted", "Draft"],
    "Department Coordinator": [],
    "AICTE Reviewing Officer": ["Document Validation", "Compliance Review", "Officer Review", "Recommended for Decision", "Clarification Requested", "Resubmission Required"],
    "Senior Approving Authority": ["Approved", "Rejected", "Returned", "Recommended for Decision", "Closed"],
    "Auditor": []
}

def transition_application_stage(
    db: Session,
    application_id: int,
    target_stage: str,
    actor_user: User,
    remarks: Optional[str] = None
) -> Application:
    """
    Executes an authorized workflow transition. Ensures human-in-the-loop governance
    and records immutable audit history. Rejection and Approval are human-only.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    current_stage = application.workflow_stage

    # 1. Validate stage transition graph
    allowed = ALLOWED_TRANSITIONS.get(current_stage, [])
    if target_stage not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition: Cannot move from '{current_stage}' to '{target_stage}'. Valid targets: {', '.join(allowed) or 'None'}"
        )

    # 2. Check user role authority
    role_allowed = ROLE_PERMISSIONS.get(actor_user.role, [])
    if target_stage not in role_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{actor_user.role}' is not authorized to transition an application to '{target_stage}'."
        )

    # 3. Apply transition
    prev_stage = application.workflow_stage
    application.workflow_stage = target_stage
    application.updated_at = datetime.now(timezone.utc)

    if remarks:
        application.decision_notes = (application.decision_notes or "") + f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {actor_user.full_name} ({actor_user.role}): {remarks}"

    if target_stage in ["Approved", "Rejected"]:
        application.decision_date = datetime.now(timezone.utc)

    db.commit()

    # Log audit event
    log_audit_event(
        db=db,
        actor_email=actor_user.email,
        actor_role=actor_user.role,
        action="APPLICATION_STAGE_TRANSITION",
        entity_type="Application",
        entity_id=application.id,
        change_summary=f"Transitioned from '{prev_stage}' to '{target_stage}'. Remarks: {remarks or 'None'}"
    )

    # Notify stakeholders via in-app alert
    alert = Alert(
        user_id=None,
        target_role="College Administrator" if actor_user.role.startswith("AICTE") or actor_user.role.startswith("Senior") else "AICTE Reviewing Officer",
        application_id=application.id,
        alert_type="Stage Transition",
        title=f"Application #{application.application_number} Moved to {target_stage}",
        message=f"Status transitioned to '{target_stage}' by {actor_user.full_name} ({actor_user.role}).",
        severity="High" if target_stage in ["Approved", "Rejected", "Clarification Requested"] else "Medium",
        is_read=False,
        is_acknowledged=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(alert)
    db.commit()

    return application

def generate_corrective_tasks_from_findings(db: Session, application_id: int, creator_user: User) -> List[Task]:
    """
    Automatically produces actionable corrective tasks from compliance findings.
    Assigns department ownership, priority, and SLA deadlines.
    """
    findings = db.query(ComplianceFinding).filter(
        ComplianceFinding.application_id == application_id,
        ComplianceFinding.status == "Open"
    ).all()

    created_tasks = []
    for f in findings:
        # Check if task already exists for this finding
        existing = db.query(Task).filter(Task.finding_id == f.id).first()
        if existing:
            continue

        dept = "Administration"
        if "faculty" in f.title.lower() or "ratio" in f.title.lower():
            dept = "Academic Affairs"
        elif "fire" in f.title.lower() or "land" in f.title.lower() or "building" in f.title.lower():
            dept = "Estate & Facilities"
        elif "ragging" in f.title.lower() or "grievance" in f.title.lower():
            dept = "Student Welfare"

        days_allowed = 7 if f.severity in ["Critical", "High"] else 14
        due_date = datetime.now(timezone.utc) + timedelta(days=days_allowed)

        task = Task(
            application_id=application_id,
            finding_id=f.id,
            title=f"Resolve: {f.title}",
            description=f"{f.description}\n\nRecommended Action: {f.suggested_action or 'Provide supporting evidence.'}",
            department=dept,
            priority=f.severity,
            status="Open",
            due_date=due_date,
            created_by_id=creator_user.id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(task)
        created_tasks.append(task)

    db.commit()
    return created_tasks
