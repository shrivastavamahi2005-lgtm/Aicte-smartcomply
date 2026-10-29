from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.entities import (
    ComplianceRule, ComplianceFinding, ValidationRun, Application, User
)
from app.schemas.schemas import (
    ComplianceRuleResponse, ComplianceFindingResponse, FindingStatusUpdate,
    ValidationRunResponse
)
from app.services.auth_service import get_current_user, require_roles
from app.services.compliance_service import evaluate_application_compliance
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/compliance", tags=["Compliance"])

@router.get("/rules", response_model=List[ComplianceRuleResponse])
def list_compliance_rules(
    verified_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ComplianceRule).filter(ComplianceRule.status == "Active")
    if verified_only is not None:
        query = query.filter(ComplianceRule.is_officially_verified == verified_only)
    return query.order_by(ComplianceRule.rule_code.asc()).all()

@router.post("/applications/{id}/validate", response_model=ValidationRunResponse)
def trigger_compliance_validation(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    val_run = evaluate_application_compliance(db, id, current_user)
    return val_run

@router.get("/applications/{id}/findings", response_model=List[ComplianceFindingResponse])
def get_application_findings(
    id: int,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ComplianceFinding).filter(ComplianceFinding.application_id == id)
    if status_filter:
        query = query.filter(ComplianceFinding.status == status_filter)
    findings = query.order_by(ComplianceFinding.created_at.desc()).all()

    resp = []
    for f in findings:
        resp.append(ComplianceFindingResponse(
            id=f.id,
            application_id=f.application_id,
            validation_run_id=f.validation_run_id,
            rule_id=f.rule_id,
            rule_code=f.rule.rule_code if f.rule else "GEN-01",
            rule_title=f.rule.title if f.rule else "General Compliance",
            finding_category=f.finding_category,
            severity=f.severity,
            title=f.title,
            description=f.description,
            conflicting_values=f.conflicting_values,
            evidence_reference=f.evidence_reference,
            suggested_action=f.suggested_action,
            status=f.status,
            assigned_to_user_id=f.assigned_to_user_id,
            resolution_notes=f.resolution_notes,
            resolved_at=f.resolved_at,
            created_at=f.created_at
        ))
    return resp

@router.put("/findings/{id}", response_model=ComplianceFindingResponse)
def update_finding_status(
    id: int,
    req: FindingStatusUpdate,
    current_user: User = Depends(require_roles(["AICTE Reviewing Officer", "Senior Approving Authority", "College Administrator"])),
    db: Session = Depends(get_db)
):
    finding = db.query(ComplianceFinding).filter(ComplianceFinding.id == id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    prev_status = finding.status
    finding.status = req.status
    finding.resolution_notes = req.resolution_notes
    if req.status in ["Resolved", "Dismissed"]:
        finding.resolved_at = datetime.now(timezone.utc)
    db.commit()

    log_audit_event(
        db=db,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="FINDING_STATUS_UPDATED",
        entity_type="ComplianceFinding",
        entity_id=finding.id,
        change_summary=f"Finding #{finding.id} status changed from '{prev_status}' to '{req.status}'. Notes: {req.resolution_notes}"
    )

    return ComplianceFindingResponse(
        id=finding.id,
        application_id=finding.application_id,
        validation_run_id=finding.validation_run_id,
        rule_id=finding.rule_id,
        rule_code=finding.rule.rule_code if finding.rule else "GEN-01",
        rule_title=finding.rule.title if finding.rule else "General",
        finding_category=finding.finding_category,
        severity=finding.severity,
        title=finding.title,
        description=finding.description,
        conflicting_values=finding.conflicting_values,
        evidence_reference=finding.evidence_reference,
        suggested_action=finding.suggested_action,
        status=finding.status,
        assigned_to_user_id=finding.assigned_to_user_id,
        resolution_notes=finding.resolution_notes,
        resolved_at=finding.resolved_at,
        created_at=finding.created_at
    )

@router.get("/applications/{id}/action-plan")
def get_compliance_action_plan(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    findings = db.query(ComplianceFinding).filter(
        ComplianceFinding.application_id == id,
        ComplianceFinding.status != "Dismissed"
    ).all()

    action_plan = []
    for f in findings:
        action_plan.append({
            "finding_id": f.id,
            "title": f.title,
            "category": f.finding_category,
            "severity": f.severity,
            "rule_code": f.rule.rule_code if f.rule else "N/A",
            "rule_title": f.rule.title if f.rule else "N/A",
            "clause": f.rule.clause_reference if f.rule else "N/A",
            "suggested_action": f.suggested_action,
            "evidence_required": f.evidence_reference,
            "status": f.status,
            "has_task": len(f.tasks) > 0
        })

    return {
        "application_id": id,
        "application_number": app.application_number,
        "readiness_score": app.internal_readiness_score,
        "compliance_status": app.compliance_status,
        "action_items": action_plan
    }
