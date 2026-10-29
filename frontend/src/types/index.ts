export type UserRole =
  | 'College Administrator'
  | 'Department Coordinator'
  | 'AICTE Reviewing Officer'
  | 'Senior Approving Authority'
  | 'Auditor';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  institution_id?: number | null;
  institution_name?: string | null;
  department?: string | null;
  is_active: boolean;
}

export interface Institution {
  id: number;
  name: string;
  code: string;
  institution_type: string;
  state: string;
  city: string;
  established_year?: number;
}

export interface Course {
  id: number;
  application_id: number;
  course_name: string;
  department: string;
  level: string;
  approved_intake: number;
  requested_intake: number;
  faculty_count: number;
  student_count: number;
}

export interface Application {
  id: number;
  application_number: string;
  institution_id: number;
  institution_name?: string;
  institution_code?: string;
  academic_year: string;
  application_type: string;
  workflow_stage: string;
  compliance_status: string;
  internal_readiness_score: number;
  deadline?: string | null;
  assigned_officer_id?: number | null;
  assigned_officer_name?: string | null;
  decision_notes?: string | null;
  decision_date?: string | null;
  created_at: string;
  updated_at: string;
  courses: Course[];
}

export interface ExtractedField {
  id: number;
  document_id: number;
  field_name: string;
  field_value?: string | null;
  field_type: string;
  confidence: number;
  is_manually_corrected: boolean;
  original_value?: string | null;
}

export interface DocumentVersion {
  id: number;
  version_number: number;
  file_name: string;
  sha256_checksum: string;
  change_notes?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: number;
  application_id: number;
  institution_id: number;
  document_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  sha256_checksum: string;
  status: string;
  extraction_confidence: number;
  authenticity_status: string;
  uploader_id?: number | null;
  version: number;
  created_at: string;
  extracted_fields: ExtractedField[];
}

export interface ComplianceRule {
  id: number;
  rule_code: string;
  title: string;
  description: string;
  official_source_title: string;
  official_source_url?: string;
  clause_reference: string;
  page_reference?: string;
  rule_version: string;
  is_officially_verified: boolean;
  effective_date?: string;
  applicable_category: string;
  severity: string;
  status: string;
  validation_logic_type: string;
}

export interface ComplianceFinding {
  id: number;
  application_id: number;
  validation_run_id?: number;
  rule_id: number;
  rule_code?: string;
  rule_title?: string;
  finding_category: string;
  severity: string;
  title: string;
  description: string;
  conflicting_values?: Record<string, any>;
  evidence_reference?: string;
  suggested_action?: string;
  status: string;
  assigned_to_user_id?: number;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ValidationRun {
  id: number;
  application_id: number;
  rule_version_snapshot: string;
  total_rules_evaluated: number;
  passed_count: number;
  failed_count: number;
  manual_review_count: number;
  not_evaluated_count: number;
  compliance_score: number;
  execution_time_ms: number;
  created_at: string;
  findings: ComplianceFinding[];
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  user_name?: string;
  comment_text: string;
  created_at: string;
}

export interface TaskRecord {
  id: number;
  application_id: number;
  application_number?: string;
  finding_id?: number;
  title: string;
  description: string;
  department: string;
  priority: string;
  status: string;
  due_date?: string | null;
  assigned_to_id?: number | null;
  assignee_name?: string | null;
  is_escalated: boolean;
  created_at: string;
  updated_at: string;
  comments: TaskComment[];
}

export interface AlertRecord {
  id: number;
  user_id?: number | null;
  target_role?: string | null;
  application_id?: number | null;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  is_acknowledged: boolean;
  acknowledged_at?: string | null;
  created_at: string;
}

export interface RuleChangeEvent {
  id: number;
  source_id: number;
  source_title?: string;
  old_version: string;
  new_version: string;
  section_reference: string;
  change_summary: string;
  impact_analysis: string;
  affected_rule_ids: string[];
  affected_application_ids: string[];
  status: string;
  reviewed_at?: string | null;
  created_at: string;
}

export interface RegulatorySource {
  id: number;
  title: string;
  document_code: string;
  source_url?: string;
  current_version: string;
  publication_date?: string;
  effective_date?: string;
  verification_status: string;
}

export interface AuditEventRecord {
  id: number;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  change_summary: string;
  timestamp: string;
}

export interface DashboardMetrics {
  total_applications: number;
  pending_officer_review: number;
  critical_findings_count: number;
  overdue_tasks_count: number;
  upcoming_deadlines_count: number;
  average_readiness_score: number;
  stage_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  top_finding_categories: { category: string; count: number }[];
  deadline_risk: {
    high_risk_applications: number;
    medium_risk_applications: number;
    low_risk_applications: number;
  };
}
