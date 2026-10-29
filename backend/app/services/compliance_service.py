import time
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.entities import (
    Application, ComplianceRule, ValidationRun, ComplianceFinding, Document,
    ExtractedField, User
)
from app.services.mismatch_service import detect_cross_document_mismatches
from app.services.audit_service import log_audit_event

def evaluate_application_compliance(db: Session, application_id: int, actor_user: User) -> ValidationRun:
    """
    Executes the full Compliance Rule Engine evaluation on an application:
    1. Checks official AICTE Approval Process Handbook (APH) rules
    2. Runs cross-document mismatch detectors
    3. Evaluates missing mandatory documents
    4. Records validation run snapshot and findings
    5. Calculates explainable readiness score
    """
    start_time = time.time()
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise ValueError(f"Application #{application_id} not found")

    rules = db.query(ComplianceRule).filter(ComplianceRule.status == "Active").all()
    documents = db.query(Document).filter(Document.application_id == application_id).all()
    courses = application.courses

    # Collect extracted fields into a lookup structure
    doc_fields: Dict[str, Dict[str, str]] = {}
    uploaded_doc_types = set()
    for doc in documents:
        uploaded_doc_types.add(doc.document_type.lower())
        doc_fields[doc.document_type] = {
            ef.field_name: ef.field_value for ef in doc.extracted_fields if ef.field_value
        }

    findings_to_create: List[Dict[str, Any]] = []
    passed_count = 0
    failed_count = 0
    manual_review_count = 0
    not_evaluated_count = 0

    for rule in rules:
        is_passed = False
        is_failed = False
        is_manual_review = False
        is_not_evaluated = False
        finding_data = None

        # 1. Student Faculty Ratio Check (RULE-AICTE-001)
        if rule.validation_logic_type == "sfr_check":
            total_students = sum(c.student_count for c in courses) if courses else 0
            total_faculty = sum(c.faculty_count for c in courses) if courses else 0

            # Check if faculty roster doc provides numbers
            for doc_type, fields in doc_fields.items():
                if "faculty" in doc_type.lower() and "total_faculty" in fields:
                    try:
                        total_faculty = int(fields["total_faculty"])
                    except ValueError:
                        pass

            if total_faculty <= 0:
                is_not_evaluated = True
                finding_data = {
                    "rule": rule,
                    "category": "Missing Data",
                    "severity": rule.severity,
                    "title": f"Insufficient Data: {rule.title}",
                    "description": "Faculty counts not provided in course declarations or faculty roster.",
                    "evidence_reference": "Application Course Details",
                    "suggested_action": "Submit certified faculty roster with total teaching faculty numbers."
                }
            else:
                sfr = total_students / total_faculty
                if sfr <= 20.0: # AICTE norm 1:20 for Engineering
                    is_passed = True
                else:
                    is_failed = True
                    finding_data = {
                        "rule": rule,
                        "category": "Ratio Non-Compliance",
                        "severity": rule.severity,
                        "title": f"Student-Faculty Ratio Deficit ({round(sfr, 1)}:1)",
                        "description": (
                            f"Current SFR is {round(sfr, 1)}:1 (Total Students: {total_students}, "
                            f"Total Faculty: {total_faculty}). AICTE APH Clause 7.1 mandates minimum 1:20."
                        ),
                        "conflicting_values": {
                            "declared_sfr": f"{round(sfr, 1)}:1",
                            "mandated_norm": "1:20",
                            "deficit_faculty_count": int((total_students / 20.0) - total_faculty) + 1
                        },
                        "evidence_reference": f"APH 2024-27 Clause {rule.clause_reference}",
                        "suggested_action": "Recruit additional approved faculty members to meet the 1:20 cadre norm before final review."
                    }

        # 2. Fire Safety & NOC Validity (RULE-AICTE-004)
        elif rule.validation_logic_type == "fire_noc_validity":
            fire_doc = next((d for d in documents if "fire" in d.document_type.lower() or "noc" in d.document_type.lower()), None)
            if not fire_doc:
                is_failed = True
                finding_data = {
                    "rule": rule,
                    "category": "Missing Document",
                    "severity": "Critical",
                    "title": "Mandatory Fire NOC Document Missing",
                    "description": "No valid Fire Safety Certificate / NOC has been uploaded for the current campus premises.",
                    "evidence_reference": f"APH 2024-27 Clause {rule.clause_reference}",
                    "suggested_action": "Upload a valid Fire Safety NOC issued by the State Fire Services Department."
                }
            else:
                fields = doc_fields.get(fire_doc.document_type, {})
                expiry = fields.get("expiry_date")
                if not expiry or expiry in ["Needs review", "Unknown"]:
                    is_manual_review = True
                    finding_data = {
                        "rule": rule,
                        "category": "Verification Required",
                        "severity": "High",
                        "title": "Fire NOC Expiration Date Requires Manual Verification",
                        "description": f"The expiration date could not be automatically extracted with high confidence from '{fire_doc.file_name}'.",
                        "evidence_reference": f"Document #{fire_doc.id}: '{fire_doc.file_name}'",
                        "suggested_action": "AICTE Reviewing Officer must inspect the certificate validity date manually."
                    }
                else:
                    is_passed = True

        # 3. Principal / Director Qualification (RULE-AICTE-003)
        elif rule.validation_logic_type == "principal_qualification":
            p_doc = next((d for d in documents if "principal" in d.document_type.lower()), None)
            if not p_doc:
                is_failed = True
                finding_data = {
                    "rule": rule,
                    "category": "Missing Document",
                    "severity": "High",
                    "title": "Principal Qualification Evidence Missing",
                    "description": "Proof of qualification and appointment order for Principal/Director not found.",
                    "evidence_reference": f"AICTE Regulations Clause {rule.clause_reference}",
                    "suggested_action": "Upload Ph.D. degree certificate and AICTE/University ratification order for Principal."
                }
            else:
                fields = doc_fields.get(p_doc.document_type, {})
                qual = fields.get("highest_qualification", "")
                if "PHD" in qual.upper():
                    is_passed = True
                else:
                    is_failed = True
                    finding_data = {
                        "rule": rule,
                        "category": "Qualification Inconsistency",
                        "severity": "High",
                        "title": "Principal Does Not Hold Mandated Ph.D. Qualification",
                        "description": f"Extracted highest qualification is '{qual or 'None'}'. AICTE norms require a Ph.D. in Engineering/Technology.",
                        "conflicting_values": {
                            "extracted_qualification": qual or "Not indicated",
                            "mandated_qualification": "Ph.D. in relevant discipline"
                        },
                        "evidence_reference": f"Doc #{p_doc.id}: '{p_doc.file_name}'",
                        "suggested_action": "Provide certified copy of doctoral degree or state statutory university exemption order."
                    }

        # 4. Mandatory Land Norms (RULE-AICTE-005)
        elif rule.validation_logic_type == "land_area":
            land_doc = next((d for d in documents if "land" in d.document_type.lower()), None)
            if not land_doc:
                is_failed = True
                finding_data = {
                    "rule": rule,
                    "category": "Missing Document",
                    "severity": "Critical",
                    "title": "Land Title / Ownership Document Missing",
                    "description": "Proof of contiguous campus land ownership or long-term lease not uploaded.",
                    "evidence_reference": f"APH 2024-27 Clause {rule.clause_reference}",
                    "suggested_action": "Upload Registered Sale Deed or 30-year Government Lease Deed."
                }
            else:
                fields = doc_fields.get(land_doc.document_type, {})
                area = fields.get("land_area_acres")
                try:
                    area_float = float(area) if area else 0.0
                    if area_float >= 2.5: # 2.5 acres min urban norm
                        is_passed = True
                    else:
                        is_failed = True
                        finding_data = {
                            "rule": rule,
                            "category": "Infrastructure Deficit",
                            "severity": "Critical",
                            "title": f"Declared Land Area ({area_float} Acres) Below AICTE Norm (2.5 Acres)",
                            "description": f"Extracted land area of {area_float} acres is below the mandated 2.5 acres for technical institutions in urban areas.",
                            "evidence_reference": f"Doc #{land_doc.id}: '{land_doc.file_name}'",
                            "suggested_action": "Submit revenue demarcation survey certificate showing total contiguous landholding."
                        }
                except (ValueError, TypeError):
                    is_manual_review = True
                    finding_data = {
                        "rule": rule,
                        "category": "Verification Required",
                        "severity": "Medium",
                        "title": "Land Acreage Requires Officer Verification",
                        "description": "Land area numerical value requires manual verification against registered deed.",
                        "evidence_reference": f"Doc #{land_doc.id}",
                        "suggested_action": "Review land deed schedule and boundary demarcation."
                    }

        # 5. Grievance Redressal Committee (RULE-AICTE-006)
        elif rule.validation_logic_type == "grievance_committee":
            g_doc = next((d for d in documents if "grievance" in d.document_type.lower() or "committee" in d.document_type.lower()), None)
            if g_doc:
                is_passed = True
            else:
                is_failed = True
                finding_data = {
                    "rule": rule,
                    "category": "Missing Document",
                    "severity": "Medium",
                    "title": "Grievance Redressal Committee Notification Missing",
                    "description": "Establishment order and composition of Student Grievance Redressal Committee (SGRC) missing.",
                    "evidence_reference": f"AICTE Regulations Clause {rule.clause_reference}",
                    "suggested_action": "Upload official office order establishing SGRC along with ombudsperson details."
                }

        # 6. Anti-Ragging Committee (RULE-AICTE-007)
        elif rule.validation_logic_type == "anti_ragging":
            ar_doc = next((d for d in documents if "ragging" in d.document_type.lower()), None)
            if ar_doc:
                is_passed = True
            else:
                is_failed = True
                finding_data = {
                    "rule": rule,
                    "category": "Missing Document",
                    "severity": "Medium",
                    "title": "Anti-Ragging Committee Notification Missing",
                    "description": "Compliance undertaking and office order for Anti-Ragging Committee not provided.",
                    "evidence_reference": f"AICTE Regulations Clause {rule.clause_reference}",
                    "suggested_action": "Upload Anti-Ragging committee order and squad member contact details."
                }

        # 7. Demo Rules Fallback (Demo Rule — Not Officially Verified)
        else:
            # Demonstration rules always clearly labeled
            is_manual_review = True
            finding_data = {
                "rule": rule,
                "category": "Demo Rule Notice",
                "severity": "Low",
                "title": f"[DEMO RULE] {rule.title}",
                "description": f"Demo rule ({rule.rule_code}) flagged for evaluation. This rule is NOT an official verified AICTE norm.",
                "evidence_reference": "SIH Demonstration Rule Engine",
                "suggested_action": "Demonstration parameter only. No official statutory penalty applies."
            }

        # Tabulate counts
        if is_passed:
            passed_count += 1
        elif is_failed:
            failed_count += 1
            if finding_data:
                findings_to_create.append(finding_data)
        elif is_manual_review:
            manual_review_count += 1
            if finding_data:
                findings_to_create.append(finding_data)
        elif is_not_evaluated:
            not_evaluated_count += 1
            if finding_data:
                findings_to_create.append(finding_data)

    # Cross-document mismatches detection
    cross_doc_findings = detect_cross_document_mismatches(db, application)
    for cdf in cross_doc_findings:
        # Link to general verification rule (RULE-AICTE-004 or general rule)
        matched_rule = rules[0] if rules else None
        findings_to_create.append({
            "rule": matched_rule,
            "category": cdf["finding_category"],
            "severity": cdf["severity"],
            "title": cdf["title"],
            "description": cdf["description"],
            "conflicting_values": cdf.get("conflicting_values"),
            "evidence_reference": cdf.get("evidence_reference"),
            "suggested_action": cdf.get("suggested_action")
        })
        failed_count += 1

    total_rules = len(rules)
    compliance_score = round((passed_count / total_rules) * 100, 1) if total_rules > 0 else 0.0

    execution_time = int((time.time() - start_time) * 1000)

    # Save Validation Run
    validation_run = ValidationRun(
        application_id=application.id,
        triggered_by_id=actor_user.id,
        rule_version_snapshot="AICTE APH 2024-27 v2.1",
        total_rules_evaluated=total_rules,
        passed_count=passed_count,
        failed_count=failed_count,
        manual_review_count=manual_review_count,
        not_evaluated_count=not_evaluated_count,
        compliance_score=compliance_score,
        execution_time_ms=execution_time,
        created_at=datetime.now(timezone.utc)
    )
    db.add(validation_run)
    db.flush()

    # Clear prior open findings to prevent duplicate accumulation on re-runs
    db.query(ComplianceFinding).filter(
        ComplianceFinding.application_id == application.id,
        ComplianceFinding.status.in_(["Open", "In Review"])
    ).delete()

    for item in findings_to_create:
        rule_obj = item["rule"]
        f = ComplianceFinding(
            application_id=application.id,
            validation_run_id=validation_run.id,
            rule_id=rule_obj.id if rule_obj else 1,
            finding_category=item["category"],
            severity=item["severity"],
            title=item["title"],
            description=item["description"],
            conflicting_values=item.get("conflicting_values"),
            evidence_reference=item.get("evidence_reference"),
            suggested_action=item.get("suggested_action"),
            status="Open",
            created_at=datetime.now(timezone.utc)
        )
        db.add(f)

    # Update application's compliance status and internal readiness score
    application.internal_readiness_score = compliance_score
    if failed_count > 0:
        application.compliance_status = "Potential Gap Detected"
    elif manual_review_count > 0:
        application.compliance_status = "Verification Required"
    else:
        application.compliance_status = "Compliant Against Configured Rules"

    db.commit()

    log_audit_event(
        db=db,
        actor_email=actor_user.email,
        actor_role=actor_user.role,
        action="COMPLIANCE_EVALUATION_COMPLETED",
        entity_type="Application",
        entity_id=application.id,
        change_summary=f"Validation run #{validation_run.id}: Evaluated {total_rules} rules. Passed: {passed_count}, Gaps: {failed_count}, Manual Review: {manual_review_count}. Readiness Score: {compliance_score}%."
    )

    return validation_run
