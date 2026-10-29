import csv
import io
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.entities import (
    Application, ComplianceFinding, Task, Document, Institution, ComplianceRule, User
)

def get_dashboard_metrics(db: Session, user: User) -> Dict[str, Any]:
    """Computes real-time system metrics directly from active database records."""
    app_query = db.query(Application)
    finding_query = db.query(ComplianceFinding)
    task_query = db.query(Task)

    # Filter by user institution if College Admin or Faculty Coordinator
    if user.role in ["College Administrator", "Department Coordinator"] and user.institution_id:
        app_query = app_query.filter(Application.institution_id == user.institution_id)
        finding_query = finding_query.join(Application).filter(Application.institution_id == user.institution_id)
        task_query = task_query.join(Application).filter(Application.institution_id == user.institution_id)

    applications = app_query.all()
    total_apps = len(applications)

    pending_officer_review = sum(1 for a in applications if a.workflow_stage in ["Submitted", "Officer Review", "Compliance Review"])
    avg_readiness = round(sum(a.internal_readiness_score for a in applications) / total_apps, 1) if total_apps > 0 else 0.0

    # Stage distribution
    stage_dist = {}
    for a in applications:
        stage_dist[a.workflow_stage] = stage_dist.get(a.workflow_stage, 0) + 1

    # Findings metrics
    open_findings = finding_query.filter(ComplianceFinding.status.in_(["Open", "In Review"])).all()
    crit_count = sum(1 for f in open_findings if f.severity == "Critical")

    severity_dist = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    category_counts = {}
    for f in open_findings:
        if f.severity in severity_dist:
            severity_dist[f.severity] += 1
        category_counts[f.finding_category] = category_counts.get(f.finding_category, 0) + 1

    top_categories = [{"category": k, "count": v} for k, v in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

    # Task metrics
    now = datetime.now(timezone.utc)
    tasks = task_query.all()
    overdue_count = 0
    for t in tasks:
        if t.status not in ["Completed", "Cancelled"] and t.due_date:
            t_due = t.due_date.replace(tzinfo=timezone.utc) if t.due_date.tzinfo is None else t.due_date
            if t_due < now:
                overdue_count += 1

    # Deadlines count
    upcoming_deadlines = sum(1 for a in applications if a.deadline and (a.deadline.replace(tzinfo=timezone.utc) if a.deadline.tzinfo is None else a.deadline) > now)

    return {
        "total_applications": total_apps,
        "pending_officer_review": pending_officer_review,
        "critical_findings_count": crit_count,
        "overdue_tasks_count": overdue_count,
        "upcoming_deadlines_count": upcoming_deadlines,
        "average_readiness_score": avg_readiness,
        "stage_distribution": stage_dist,
        "severity_distribution": severity_dist,
        "top_finding_categories": top_categories,
        "deadline_risk": {
            "high_risk_applications": sum(1 for a in applications if a.internal_readiness_score < 60 and a.workflow_stage not in ["Approved", "Closed"]),
            "medium_risk_applications": sum(1 for a in applications if 60 <= a.internal_readiness_score < 80 and a.workflow_stage not in ["Approved", "Closed"]),
            "low_risk_applications": sum(1 for a in applications if a.internal_readiness_score >= 80 or a.workflow_stage in ["Approved", "Closed"])
        }
    }

def generate_applications_csv(db: Session, user: User) -> str:
    """Exports application lifecycle records into CSV format."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Application ID", "Application Number", "Institution Name", "Institution Code",
        "Academic Year", "Application Type", "Workflow Stage", "Compliance Status",
        "Readiness Score (%)", "Deadline", "Created At"
    ])

    app_query = db.query(Application)
    if user.role in ["College Administrator", "Department Coordinator"] and user.institution_id:
        app_query = app_query.filter(Application.institution_id == user.institution_id)

    for app in app_query.all():
        inst_name = app.institution.name if app.institution else "N/A"
        inst_code = app.institution.code if app.institution else "N/A"
        deadline_str = app.deadline.strftime("%Y-%m-%d") if app.deadline else "None"
        created_str = app.created_at.strftime("%Y-%m-%d %H:%M") if app.created_at else ""

        writer.writerow([
            app.id, app.application_number, inst_name, inst_code,
            app.academic_year, app.application_type, app.workflow_stage,
            app.compliance_status, app.internal_readiness_score, deadline_str, created_str
        ])

    return output.getvalue()
