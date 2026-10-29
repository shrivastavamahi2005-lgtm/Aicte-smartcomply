from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.core.database import get_db
from app.models.entities import RegulatorySource, RuleChangeEvent, User
from app.schemas.schemas import RegulatorySourceResponse, RuleChangeEventResponse
from app.services.auth_service import get_current_user, require_roles
from app.services.radar_service import compare_handbook_versions, verify_and_apply_rule_change

router = APIRouter(prefix="/radar", tags=["Rule Change Radar"])

class CompareRequest(BaseModel):
    source_id: int
    old_version_tag: str
    new_version_tag: str

class VerifyChangeRequest(BaseModel):
    action: str # "Verified" or "Dismissed"
    notes: str

@router.get("/sources", response_model=List[RegulatorySourceResponse])
def list_regulatory_sources(db: Session = Depends(get_db)):
    sources = db.query(RegulatorySource).all()
    return sources

@router.post("/compare")
def compare_versions(
    req: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = compare_handbook_versions(
        db=db,
        source_id=req.source_id,
        old_version_tag=req.old_version_tag,
        new_version_tag=req.new_version_tag,
        actor_user=current_user
    )
    return result

@router.get("/events", response_model=List[RuleChangeEventResponse])
def list_change_events(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RuleChangeEvent)
    if status_filter:
        query = query.filter(RuleChangeEvent.status == status_filter)
    events = query.order_by(RuleChangeEvent.created_at.desc()).all()

    resp = []
    for e in events:
        resp.append(RuleChangeEventResponse(
            id=e.id,
            source_id=e.source_id,
            source_title=e.source.title if e.source else "AICTE Handbook",
            old_version=e.old_version,
            new_version=e.new_version,
            section_reference=e.section_reference,
            change_summary=e.change_summary,
            impact_analysis=e.impact_analysis,
            affected_rule_ids=e.affected_rule_ids or [],
            affected_application_ids=e.affected_application_ids or [],
            status=e.status,
            reviewed_at=e.reviewed_at,
            created_at=e.created_at
        ))
    return resp

@router.post("/events/{id}/verify", response_model=RuleChangeEventResponse)
def verify_event(
    id: int,
    req: VerifyChangeRequest,
    current_user: User = Depends(require_roles(["AICTE Reviewing Officer", "Senior Approving Authority"])),
    db: Session = Depends(get_db)
):
    event = verify_and_apply_rule_change(
        db=db,
        change_event_id=id,
        action=req.action,
        reviewer_user=current_user,
        notes=req.notes
    )
    return RuleChangeEventResponse(
        id=event.id,
        source_id=event.source_id,
        source_title=event.source.title if event.source else "AICTE Handbook",
        old_version=event.old_version,
        new_version=event.new_version,
        section_reference=event.section_reference,
        change_summary=event.change_summary,
        impact_analysis=event.impact_analysis,
        affected_rule_ids=event.affected_rule_ids or [],
        affected_application_ids=event.affected_application_ids or [],
        status=event.status,
        reviewed_at=event.reviewed_at,
        created_at=event.created_at
    )
