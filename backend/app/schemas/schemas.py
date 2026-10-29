from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class LoginRequest(BaseModel):
    email: str
    password: str

class PasswordResetRequest(BaseModel):
    email: str
    old_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    institution_id: Optional[int] = None
    institution_name: Optional[str] = None
    department: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# --- Institution & Course Schemas ---
class InstitutionResponse(BaseModel):
    id: int
    name: str
    code: str
    institution_type: str
    state: str
    city: str
    established_year: Optional[int]

    class Config:
        from_attributes = True

class CourseCreate(BaseModel):
    course_name: str
    department: str
    level: str = "UG"
    approved_intake: int = 60
    requested_intake: int = 60
    faculty_count: int = 4
    student_count: int = 240

class CourseResponse(CourseCreate):
    id: int
    application_id: int

    class Config:
        from_attributes = True

# --- Application Schemas ---
class ApplicationCreate(BaseModel):
    institution_id: int
    academic_year: str = "2026-2027"
    application_type: str = "Extension of Approval"
    courses: Optional[List[CourseCreate]] = []

class ApplicationUpdate(BaseModel):
    application_type: Optional[str] = None
    academic_year: Optional[str] = None
    decision_notes: Optional[str] = None

class ApplicationWorkflowTransition(BaseModel):
    target_stage: str
    remarks: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    application_number: str
    institution_id: int
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    academic_year: str
    application_type: str
    workflow_stage: str
    compliance_status: str
    internal_readiness_score: float
    deadline: Optional[datetime] = None
    assigned_officer_id: Optional[int] = None
    assigned_officer_name: Optional[str] = None
    decision_notes: Optional[str] = None
    decision_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    courses: List[CourseResponse] = []

    class Config:
        from_attributes = True

# --- Document Schemas ---
class ExtractedFieldResponse(BaseModel):
    id: int
    document_id: int
    field_name: str
    field_value: Optional[str] = None
    field_type: str
    confidence: float
    is_manually_corrected: bool
    original_value: Optional[str] = None

    class Config:
        from_attributes = True

class ExtractedFieldUpdate(BaseModel):
    field_value: str
    reason: Optional[str] = "Manual operator correction"

class DocumentVersionResponse(BaseModel):
    id: int
    version_number: int
    file_name: str
    sha256_checksum: str
    change_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    application_id: int
    institution_id: int
    document_type: str
    file_name: str
    file_size: int
    mime_type: str
    sha256_checksum: str
    status: str
    extraction_confidence: float
    authenticity_status: str
    uploader_id: Optional[int] = None
    version: int
    created_at: datetime
    extracted_fields: List[ExtractedFieldResponse] = []

    class Config:
        from_attributes = True

# --- Compliance Rules & Findings Schemas ---
class ComplianceRuleResponse(BaseModel):
    id: int
    rule_code: str
    title: str
    description: str
    official_source_title: str
    official_source_url: Optional[str] = None
    clause_reference: str
    page_reference: Optional[str] = None
    rule_version: str
    is_officially_verified: bool
    effective_date: Optional[str] = None
    applicable_category: str
    severity: str
    status: str
    validation_logic_type: str

    class Config:
        from_attributes = True

class ComplianceFindingResponse(BaseModel):
    id: int
    application_id: int
    validation_run_id: Optional[int] = None
    rule_id: int
    rule_code: Optional[str] = None
    rule_title: Optional[str] = None
    finding_category: str
    severity: str
    title: str
    description: str
    conflicting_values: Optional[Dict[str, Any]] = None
    evidence_reference: Optional[str] = None
    suggested_action: Optional[str] = None
    status: str
    assigned_to_user_id: Optional[int] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FindingStatusUpdate(BaseModel):
    status: str # Open, In Review, Resolved, Dismissed
    resolution_notes: str

class ValidationRunResponse(BaseModel):
    id: int
    application_id: int
    rule_version_snapshot: str
    total_rules_evaluated: int
    passed_count: int
    failed_count: int
    manual_review_count: int
    not_evaluated_count: int
    compliance_score: float
    execution_time_ms: int
    created_at: datetime
    findings: List[ComplianceFindingResponse] = []

    class Config:
        from_attributes = True

# --- Tasks & Workflow Schemas ---
class TaskCommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    user_name: Optional[str] = None
    comment_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class TaskCommentCreate(BaseModel):
    comment_text: str

class TaskCreate(BaseModel):
    application_id: int
    finding_id: Optional[int] = None
    title: str
    description: str
    department: str = "Administration"
    priority: str = "High"
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_id: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: int
    application_id: int
    application_number: Optional[str] = None
    finding_id: Optional[int] = None
    title: str
    description: str
    department: str
    priority: str
    status: str
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[int] = None
    assignee_name: Optional[str] = None
    is_escalated: bool
    created_at: datetime
    updated_at: datetime
    comments: List[TaskCommentResponse] = []

    class Config:
        from_attributes = True

# --- Alerts & Notifications Schemas ---
class AlertResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    target_role: Optional[str] = None
    application_id: Optional[int] = None
    alert_type: str
    title: str
    message: str
    severity: str
    is_read: bool
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Rule Change Radar Schemas ---
class RegulatorySourceResponse(BaseModel):
    id: int
    title: str
    document_code: str
    source_url: Optional[str] = None
    current_version: str
    publication_date: Optional[str] = None
    effective_date: Optional[str] = None
    verification_status: str

    class Config:
        from_attributes = True

class RuleChangeEventResponse(BaseModel):
    id: int
    source_id: int
    source_title: Optional[str] = None
    old_version: str
    new_version: str
    section_reference: str
    change_summary: str
    impact_analysis: str
    affected_rule_ids: Optional[List[str]] = []
    affected_application_ids: Optional[List[str]] = []
    status: str
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Graph Schemas ---
class GraphNode(BaseModel):
    id: str
    type: str # institution, application, course, document, rule, finding, task
    data: Dict[str, Any]
    position: Dict[str, float]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: Optional[bool] = False

class ComplianceGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# --- AI Copilot Schemas ---
class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_role: str
    content: str
    citations: Optional[List[Dict[str, str]]] = None
    is_fallback: bool
    created_at: datetime

class ChatQueryRequest(BaseModel):
    message: str
    application_id: Optional[int] = None
    conversation_id: Optional[int] = None

# --- Audit & Analytics Schemas ---
class AuditEventResponse(BaseModel):
    id: int
    actor_email: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    change_summary: str
    timestamp: datetime

    class Config:
        from_attributes = True

class DashboardMetricsResponse(BaseModel):
    total_applications: int
    pending_officer_review: int
    critical_findings_count: int
    overdue_tasks_count: int
    upcoming_deadlines_count: int
    average_readiness_score: float
    stage_distribution: Dict[str, int]
    severity_distribution: Dict[str, int]
    top_finding_categories: List[Dict[str, Any]]
    deadline_risk: Dict[str, Any]
