import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.entities import AuditEvent

def log_audit_event(
    db: Session,
    actor_email: str,
    actor_role: str,
    action: str,
    entity_type: str,
    entity_id: str | int,
    change_summary: str,
    correlation_id: str = None
) -> AuditEvent:
    """Records an immutable audit event in the system log."""
    if not correlation_id:
        correlation_id = str(uuid.uuid4())[:8]

    event = AuditEvent(
        actor_email=actor_email,
        actor_role=actor_role,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        change_summary=change_summary,
        correlation_id=correlation_id,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
