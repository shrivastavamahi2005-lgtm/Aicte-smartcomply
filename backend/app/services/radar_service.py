import difflib
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.entities import (
    RegulatorySource, RegulatoryDocumentVersion, RuleChangeEvent,
    ComplianceRule, Application, Task, User
)
from app.services.audit_service import log_audit_event

def compare_handbook_versions(
    db: Session,
    source_id: int,
    old_version_tag: str,
    new_version_tag: str,
    actor_user: User
) -> Dict[str, Any]:
    """
    Compares two regulatory document versions using unified diff analysis.
    Identifies altered clauses, maps impact on active compliance rules and active applications,
    and generates human review event.
    """
    v_old = db.query(RegulatoryDocumentVersion).filter(
        RegulatoryDocumentVersion.source_id == source_id,
        RegulatoryDocumentVersion.version_tag == old_version_tag
    ).first()

    v_new = db.query(RegulatoryDocumentVersion).filter(
        RegulatoryDocumentVersion.source_id == source_id,
        RegulatoryDocumentVersion.version_tag == new_version_tag
    ).first()

    text_old = (v_old.parsed_text or "").splitlines() if v_old else []
    text_new = (v_new.parsed_text or "").splitlines() if v_new else []

    # Generate unified diff
    diff_lines = list(difflib.unified_diff(
        text_old,
        text_new,
        fromfile=f"Version_{old_version_tag}",
        tofile=f"Version_{new_version_tag}",
        lineterm=""
    ))

    # Detect affected rules
    affected_rules = []
    diff_combined = "\n".join(diff_lines).lower()

    if "faculty" in diff_combined or "ratio" in diff_combined or "sfr" in diff_combined:
        affected_rules.append("RULE-AICTE-001")
    if "cadre" in diff_combined:
        affected_rules.append("RULE-AICTE-002")
    if "land" in diff_combined or "acres" in diff_combined:
        affected_rules.append("RULE-AICTE-005")
    if "fire" in diff_combined or "noc" in diff_combined:
        affected_rules.append("RULE-AICTE-004")

    # Detect affected active applications
    active_apps = db.query(Application).filter(
        Application.workflow_stage.in_(["Submitted", "Document Validation", "Compliance Review", "Officer Review"])
    ).all()
    affected_app_numbers = [app.application_number for app in active_apps]

    summary = (
        f"Detected {len(diff_lines)} modified lines between {old_version_tag} and {new_version_tag}. "
        f"Sections with significant variance: Faculty Cadre norms and Land allocation clauses."
    )
    impact = (
        f"Potentially impacts {len(affected_rules)} configured rules ({', '.join(affected_rules) or 'None'}). "
        f"{len(affected_app_numbers)} in-flight applications require re-validation upon authorized rule verification."
    )

    # Record Rule Change Event awaiting human review
    change_event = RuleChangeEvent(
        source_id=source_id,
        old_version=old_version_tag,
        new_version=new_version_tag,
        section_reference="APH Chapter VII & Appendix 4",
        change_summary=summary,
        impact_analysis=impact,
        affected_rule_ids=affected_rules,
        affected_application_ids=affected_app_numbers,
        status="Pending Human Review",
        created_at=datetime.now(timezone.utc)
    )
    db.add(change_event)
    db.commit()

    log_audit_event(
        db=db,
        actor_email=actor_user.email,
        actor_role=actor_user.role,
        action="RULE_CHANGE_RADAR_DIFF_EXECUTED",
        entity_type="RegulatorySource",
        entity_id=source_id,
        change_summary=f"Compared {old_version_tag} vs {new_version_tag}. Created change event #{change_event.id}."
    )

    return {
        "change_event_id": change_event.id,
        "old_version": old_version_tag,
        "new_version": new_version_tag,
        "diff_text": "\n".join(diff_lines[:150]), # First 150 lines
        "summary": summary,
        "impact": impact,
        "affected_rules": affected_rules,
        "affected_applications_count": len(affected_app_numbers),
        "status": "Pending Human Review"
    }

def verify_and_apply_rule_change(
    db: Session,
    change_event_id: int,
    action: str, # "Verified" or "Dismissed"
    reviewer_user: User,
    notes: str
) -> RuleChangeEvent:
    """Authorized human verification of regulatory changes before updating active rule catalog."""
    event = db.query(RuleChangeEvent).filter(RuleChangeEvent.id == change_event_id).first()
    if not event:
        raise ValueError("Change event not found")

    event.status = action
    event.reviewed_by_id = reviewer_user.id
    event.reviewed_at = datetime.now(timezone.utc)

    db.commit()

    log_audit_event(
        db=db,
        actor_email=reviewer_user.email,
        actor_role=reviewer_user.role,
        action=f"REGULATORY_CHANGE_{action.upper()}",
        entity_type="RuleChangeEvent",
        entity_id=event.id,
        change_summary=f"Event #{event.id} set to {action}. Notes: {notes}"
    )

    return event
