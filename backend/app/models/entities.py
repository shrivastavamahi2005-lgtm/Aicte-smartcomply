import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(64), nullable=False, index=True) # College Administrator, Department Coordinator, AICTE Reviewing Officer, Senior Approving Authority, Auditor
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    department = Column(String(128), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    institution = relationship("Institution", back_populates="users")
    tasks_assigned = relationship("Task", foreign_keys="Task.assigned_to_id", back_populates="assignee")
    alerts = relationship("Alert", back_populates="user")


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(64), unique=True, index=True, nullable=False)
    institution_type = Column(String(64), default="Technical Institute") # Engineering, Management, Pharmacy, Polytechnic
    state = Column(String(128), nullable=False)
    city = Column(String(128), nullable=False)
    address = Column(Text, nullable=True)
    established_year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    users = relationship("User", back_populates="institution")
    applications = relationship("Application", back_populates="institution")
    documents = relationship("Document", back_populates="institution")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_number = Column(String(64), unique=True, index=True, nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(32), default="2026-2027")
    application_type = Column(String(64), default="Extension of Approval") # Extension of Approval, New Institution, New Course, Intake Change
    workflow_stage = Column(String(64), default="Draft", index=True) # Draft, Submitted, Document Validation, Compliance Review, Clarification Requested, Resubmission Required, Officer Review, Recommended for Decision, Approved, Rejected, Returned, Closed
    compliance_status = Column(String(64), default="Not Evaluated", index=True) # Compliant Against Configured Rules, Potential Gap Detected, Verification Required, Not Evaluated, Official Verification Pending
    internal_readiness_score = Column(Float, default=0.0)
    deadline = Column(DateTime(timezone=True), nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision_notes = Column(Text, nullable=True)
    decision_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    institution = relationship("Institution", back_populates="applications")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id])
    courses = relationship("ApplicationCourse", back_populates="application", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    validation_runs = relationship("ValidationRun", back_populates="application", cascade="all, delete-orphan")
    findings = relationship("ComplianceFinding", back_populates="application", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="application", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="application", cascade="all, delete-orphan")


class ApplicationCourse(Base):
    __tablename__ = "application_courses"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    course_name = Column(String(255), nullable=False)
    department = Column(String(128), nullable=False)
    level = Column(String(32), default="UG") # UG, PG, Diploma
    approved_intake = Column(Integer, default=60)
    requested_intake = Column(Integer, default=60)
    faculty_count = Column(Integer, default=4)
    student_count = Column(Integer, default=240)

    application = relationship("Application", back_populates="courses")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(128), nullable=False, index=True) # Land Certificate, Building Safety, Fire NOC, Faculty Roster, Principal Qualification, Board Resolution, AICTE Mandate
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(128), default="application/pdf")
    sha256_checksum = Column(String(64), nullable=False, index=True)
    status = Column(String(64), default="Uploaded") # Uploaded, Processing, Extracted, Validation Required, Verified, Rejected, Superseded
    extraction_confidence = Column(Float, default=0.0)
    authenticity_status = Column(String(128), default="Authenticity not independently verified")
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    version = Column(Integer, default=1)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    application = relationship("Application", back_populates="documents")
    institution = relationship("Institution", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploader_id])
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    sha256_checksum = Column(String(64), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    change_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    document = relationship("Document", back_populates="versions")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(128), nullable=False, index=True)
    field_value = Column(Text, nullable=True)
    field_type = Column(String(64), default="string") # string, number, date, boolean
    confidence = Column(Float, default=1.0)
    is_manually_corrected = Column(Boolean, default=False)
    corrected_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    original_value = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    document = relationship("Document", back_populates="extracted_fields")


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    official_source_title = Column(String(255), nullable=False)
    official_source_url = Column(String(512), nullable=True)
    clause_reference = Column(String(128), nullable=False)
    page_reference = Column(String(64), nullable=True)
    rule_version = Column(String(32), default="APH 2024-27")
    is_officially_verified = Column(Boolean, default=True) # True = Verified AICTE Rule, False = Demo Rule - Not Officially Verified
    effective_date = Column(String(64), nullable=True)
    applicable_category = Column(String(128), default="All Institutions")
    severity = Column(String(32), default="High") # Critical, High, Medium, Low
    status = Column(String(32), default="Active") # Active, Draft, Superseded, Archived
    validation_logic_type = Column(String(64), nullable=False) # sfr_check, cadre_ratio, principal_qualification, fire_noc_validity, land_area, grievance_committee, anti_ragging
    last_verified_at = Column(DateTime(timezone=True), default=utcnow)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    findings = relationship("ComplianceFinding", back_populates="rule")


class ValidationRun(Base):
    __tablename__ = "validation_runs"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    triggered_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rule_version_snapshot = Column(String(64), default="APH 2024-27 v1.0")
    total_rules_evaluated = Column(Integer, default=0)
    passed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    manual_review_count = Column(Integer, default=0)
    not_evaluated_count = Column(Integer, default=0)
    compliance_score = Column(Float, default=0.0)
    execution_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    application = relationship("Application", back_populates="validation_runs")
    findings = relationship("ComplianceFinding", back_populates="validation_run")


class ComplianceFinding(Base):
    __tablename__ = "compliance_findings"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    validation_run_id = Column(Integer, ForeignKey("validation_runs.id", ondelete="SET NULL"), nullable=True)
    rule_id = Column(Integer, ForeignKey("compliance_rules.id", ondelete="CASCADE"), nullable=False)
    finding_category = Column(String(64), nullable=False, index=True) # Missing Document, Ratio Non-Compliance, Cadre Inconsistency, Expired Certificate, Cross-Doc Mismatch, Infrastructure Deficit
    severity = Column(String(32), default="High") # Critical, High, Medium, Low
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    conflicting_values = Column(JSON, nullable=True) # {"source_a": "...", "source_b": "..."}
    evidence_reference = Column(String(255), nullable=True)
    suggested_action = Column(Text, nullable=True)
    status = Column(String(32), default="Open", index=True) # Open, In Review, Resolved, Dismissed, Escalated
    assigned_to_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    application = relationship("Application", back_populates="findings")
    validation_run = relationship("ValidationRun", back_populates="findings")
    rule = relationship("ComplianceRule", back_populates="findings")
    tasks = relationship("Task", back_populates="finding")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    finding_id = Column(Integer, ForeignKey("compliance_findings.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    department = Column(String(128), default="Administration")
    priority = Column(String(32), default="High") # Critical, High, Medium, Low
    status = Column(String(32), default="Open", index=True) # Open, In Progress, Awaiting Information, Submitted for Review, Completed, Cancelled
    due_date = Column(DateTime(timezone=True), nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_escalated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    application = relationship("Application", back_populates="tasks")
    finding = relationship("ComplianceFinding", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to_id], back_populates="tasks_assigned")
    creator = relationship("User", foreign_keys=[created_by_id])
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")


class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comment_text = Column(Text, nullable=False)
    attachment_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    task = relationship("Task", back_populates="comments")
    author = relationship("User")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    target_role = Column(String(64), nullable=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=True)
    alert_type = Column(String(64), nullable=False, index=True) # Upcoming Deadline, Overdue Task, Missing Document, Expiring Document, Critical Finding, Clarification Received, Rule Update, Stage Transition, Escalation
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(32), default="High") # Critical, High, Medium, Low
    is_read = Column(Boolean, default=False)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="alerts")
    application = relationship("Application", back_populates="alerts")


class RegulatorySource(Base):
    __tablename__ = "regulatory_sources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    document_code = Column(String(64), unique=True, index=True, nullable=False)
    source_url = Column(String(512), nullable=True)
    current_version = Column(String(32), default="APH 2024-27")
    publication_date = Column(String(64), nullable=True)
    effective_date = Column(String(64), nullable=True)
    verification_status = Column(String(64), default="Verified Applicable") # Verified Applicable, Draft Policy, Superseded
    created_at = Column(DateTime(timezone=True), default=utcnow)

    versions = relationship("RegulatoryDocumentVersion", back_populates="source", cascade="all, delete-orphan")
    change_events = relationship("RuleChangeEvent", back_populates="source", cascade="all, delete-orphan")


class RegulatoryDocumentVersion(Base):
    __tablename__ = "regulatory_document_versions"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("regulatory_sources.id", ondelete="CASCADE"), nullable=False)
    version_tag = Column(String(32), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    parsed_text = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    source = relationship("RegulatorySource", back_populates="versions")


class RuleChangeEvent(Base):
    __tablename__ = "rule_change_events"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("regulatory_sources.id", ondelete="CASCADE"), nullable=False)
    old_version = Column(String(32), nullable=False)
    new_version = Column(String(32), nullable=False)
    section_reference = Column(String(128), nullable=False)
    change_summary = Column(Text, nullable=False)
    impact_analysis = Column(Text, nullable=False)
    affected_rule_ids = Column(JSON, nullable=True) # list of rule codes
    affected_application_ids = Column(JSON, nullable=True) # list of application numbers
    status = Column(String(64), default="Pending Human Review") # Pending Human Review, Verified, Dismissed
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    source = relationship("RegulatorySource", back_populates="change_events")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_email = Column(String(255), nullable=False, index=True)
    actor_role = Column(String(64), nullable=False)
    action = Column(String(128), nullable=False, index=True)
    entity_type = Column(String(64), nullable=False, index=True)
    entity_id = Column(String(64), nullable=False)
    change_summary = Column(Text, nullable=False)
    correlation_id = Column(String(64), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)


class ChatbotConversation(Base):
    __tablename__ = "chatbot_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="AI Compliance Assistance")
    created_at = Column(DateTime(timezone=True), default=utcnow)

    messages = relationship("ChatbotMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chatbot_conversations.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(String(32), nullable=False) # user / assistant
    content = Column(Text, nullable=False)
    citations_json = Column(JSON, nullable=True) # list of references
    is_fallback = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    conversation = relationship("ChatbotConversation", back_populates="messages")
