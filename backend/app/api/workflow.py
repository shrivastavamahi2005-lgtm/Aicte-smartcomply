from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.entities import Task, TaskComment, Application, User
from app.schemas.schemas import (
    TaskResponse, TaskCreate, TaskUpdate, TaskCommentResponse, TaskCommentCreate
)
from app.services.auth_service import get_current_user
from app.services.workflow_service import generate_corrective_tasks_from_findings
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/workflow", tags=["Workflow & Tasks"])

def build_task_response(t: Task) -> TaskResponse:
    assignee_name = t.assignee.full_name if t.assignee else None
    app_num = t.application.application_number if t.application else None
    comments_resp = [
        TaskCommentResponse(
            id=c.id,
            task_id=c.task_id,
            user_id=c.user_id,
            user_name=c.author.full_name if c.author else "User",
            comment_text=c.comment_text,
            created_at=c.created_at
        )
        for c in t.comments
    ]
    return TaskResponse(
        id=t.id,
        application_id=t.application_id,
        application_number=app_num,
        finding_id=t.finding_id,
        title=t.title,
        description=t.description,
        department=t.department,
        priority=t.priority,
        status=t.status,
        due_date=t.due_date,
        assigned_to_id=t.assigned_to_id,
        assignee_name=assignee_name,
        is_escalated=t.is_escalated,
        created_at=t.created_at,
        updated_at=t.updated_at,
        comments=comments_resp
    )

@router.get("/tasks", response_model=List[TaskResponse])
def list_tasks(
    application_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    if application_id:
        query = query.filter(Task.application_id == application_id)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if department:
        query = query.filter(Task.department == department)

    # If college user, restrict to institution
    if current_user.role in ["College Administrator", "Department Coordinator"] and current_user.institution_id:
        query = query.join(Application).filter(Application.institution_id == current_user.institution_id)

    tasks = query.order_by(Task.due_date.asc()).all()
    return [build_task_response(t) for t in tasks]

@router.post("/tasks", response_model=TaskResponse)
def create_task(
    req: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == req.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    task = Task(
        application_id=req.application_id,
        finding_id=req.finding_id,
        title=req.title,
        description=req.description,
        department=req.department,
        priority=req.priority,
        status="Open",
        due_date=req.due_date,
        assigned_to_id=req.assigned_to_id,
        created_by_id=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    log_audit_event(
        db=db,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="TASK_CREATED",
        entity_type="Task",
        entity_id=task.id,
        change_summary=f"Created task '{task.title}' for application #{app.application_number}."
    )

    return build_task_response(task)

@router.put("/tasks/{id}", response_model=TaskResponse)
def update_task(
    id: int,
    req: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    prev_status = task.status
    if req.status:
        task.status = req.status
    if req.priority:
        task.priority = req.priority
    if req.assigned_to_id is not None:
        task.assigned_to_id = req.assigned_to_id
    if req.due_date:
        task.due_date = req.due_date

    task.updated_at = datetime.now(timezone.utc)
    db.commit()

    log_audit_event(
        db=db,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="TASK_UPDATED",
        entity_type="Task",
        entity_id=task.id,
        change_summary=f"Task #{task.id} status changed from '{prev_status}' to '{task.status}'."
    )

    return build_task_response(task)

@router.post("/tasks/{id}/comments", response_model=TaskResponse)
def add_task_comment(
    id: int,
    req: TaskCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comment = TaskComment(
        task_id=task.id,
        user_id=current_user.id,
        comment_text=req.comment_text,
        created_at=datetime.now(timezone.utc)
    )
    db.add(comment)
    db.commit()
    db.refresh(task)

    return build_task_response(task)

@router.post("/applications/{id}/generate-tasks", response_model=List[TaskResponse])
def generate_corrective_tasks(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    created = generate_corrective_tasks_from_findings(db, id, current_user)
    return [build_task_response(t) for t in created]
