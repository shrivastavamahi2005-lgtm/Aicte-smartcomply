from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Application, Task, ComplianceFinding, Alert, User

def evaluate_deadline_risk(db: Session, application_id: int) -> Dict[str, Any]:
    """
    Explainable Deadline Risk Engine:
    Evaluates temporal urgency, finding severity, pending workload, and workflow stage.
    Never claims certainty; provides transparent heuristic factors.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        return {"risk_level": "Unknown", "score": 0, "factors": []}

    now = datetime.now(timezone.utc)
    factors = []
    risk_score = 0 # 0 to 100

    # Factor 1: Deadline Proximity
    if application.deadline:
        deadline_tz = application.deadline.replace(tzinfo=timezone.utc) if application.deadline.tzinfo is None else application.deadline
        days_remaining = (deadline_tz - now).days
        if days_remaining < 0:
            risk_score += 40
            factors.append(f"Statutory submission deadline expired {abs(days_remaining)} days ago (+40 risk)")
        elif days_remaining <= 5:
            risk_score += 35
            factors.append(f"Only {days_remaining} days remaining before review deadline (+35 risk)")
        elif days_remaining <= 14:
            risk_score += 20
            factors.append(f"{days_remaining} days remaining until deadline (+20 risk)")
        else:
            factors.append(f"{days_remaining} days remaining until deadline (Sufficient temporal runway)")
    else:
        factors.append("No hard statutory deadline configured; default standard cycle applies")

    # Factor 2: Critical / High Unresolved Findings
    unresolved_findings = db.query(ComplianceFinding).filter(
        ComplianceFinding.application_id == application_id,
        ComplianceFinding.status.in_(["Open", "In Review"])
    ).all()

    crit_count = sum(1 for f in unresolved_findings if f.severity == "Critical")
    high_count = sum(1 for f in unresolved_findings if f.severity == "High")

    if crit_count > 0:
        risk_score += min(35, crit_count * 15)
        factors.append(f"{crit_count} Critical compliance gap(s) unresolved (+{min(35, crit_count * 15)} risk)")
    if high_count > 0:
        risk_score += min(20, high_count * 5)
        factors.append(f"{high_count} High-severity gap(s) pending (+{min(20, high_count * 5)} risk)")

    # Factor 3: Overdue or Pending Tasks
    tasks = db.query(Task).filter(Task.application_id == application_id).all()
    overdue_tasks = 0
    for t in tasks:
        if t.status not in ["Completed", "Cancelled"] and t.due_date:
            due_tz = t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date
            if due_tz < now:
                overdue_tasks += 1

    if overdue_tasks > 0:
        risk_score += min(25, overdue_tasks * 10)
        factors.append(f"{overdue_tasks} overdue corrective task(s) on internal board (+{min(25, overdue_tasks * 10)} risk)")

    # Determine risk category
    if risk_score >= 60:
        level = "High"
        recommendation = "Immediate escalation: Prioritize critical evidence uploads (Fire NOC/Land) and assign dedicated coordinator."
    elif risk_score >= 30:
        level = "Medium"
        recommendation = "Active monitoring: Review open tasks and verify pending faculty/committee documentation."
    else:
        level = "Low"
        recommendation = "On schedule: Continue regular workflow verification and prepare final dossier."

    return {
        "application_id": application_id,
        "application_number": application.application_number,
        "risk_level": level,
        "risk_score": min(100, risk_score),
        "factors": factors,
        "recommendation": recommendation,
        "methodology": "Explainable Multi-Factor Regulatory SLA Heuristic Model"
    }

def acknowledge_alert(db: Session, alert_id: int, user: User) -> Alert:
    """Marks an alert as acknowledged by user."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_acknowledged = True
        alert.is_read = True
        alert.acknowledged_at = datetime.now(timezone.utc)
        db.commit()
    return alert
