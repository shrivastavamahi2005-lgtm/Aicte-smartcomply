import os
import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.core.config import settings
from app.models.entities import (
    User, Institution, Application, ApplicationCourse, Document, DocumentVersion,
    ExtractedField, ComplianceRule, ValidationRun, ComplianceFinding, Task,
    TaskComment, Alert, RegulatorySource, RegulatoryDocumentVersion, RuleChangeEvent,
    AuditEvent
)

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    import sys
    is_force = "--force" in sys.argv or "--reset" in sys.argv
    existing_user_count = db.query(User).count()
    if existing_user_count > 0 and not is_force:
        print(f"Database already contains {existing_user_count} users and initial records. Skipping destructive wipe. (Run with '--force' to reset)")
        db.close()
        return

    # Clear existing data to allow clean re-seeding
    try:
        db.query(TaskComment).delete()
        db.query(Task).delete()
        db.query(ComplianceFinding).delete()
        db.query(ValidationRun).delete()
        db.query(ExtractedField).delete()
        db.query(DocumentVersion).delete()
        db.query(Document).delete()
        db.query(ApplicationCourse).delete()
        db.query(Alert).delete()
        db.query(RuleChangeEvent).delete()
        db.query(RegulatoryDocumentVersion).delete()
        db.query(RegulatorySource).delete()
        db.query(ComplianceRule).delete()
        db.query(Application).delete()
        db.query(User).delete()
        db.query(Institution).delete()
        db.query(AuditEvent).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Cleanup error: {e}")

    print("Seeding Institutions...")
    inst1 = Institution(
        name="National Institute of Technology & Science",
        code="1-39201928",
        institution_type="Engineering & Technology",
        state="Delhi",
        city="New Delhi",
        address="Institutional Area, Sector 5, Dwarka, New Delhi 110078",
        established_year=2008
    )
    inst2 = Institution(
        name="Apex Institute of Engineering & Technology",
        code="1-84920412",
        institution_type="Engineering & Technology",
        state="Maharashtra",
        city="Pune",
        address="Tech Valley Road, Hinjawadi Phase 2, Pune 411057",
        established_year=2012
    )
    inst3 = Institution(
        name="Global Institute of Pharmacy & Bio-Tech",
        code="1-71930219",
        institution_type="Pharmacy",
        state="Karnataka",
        city="Bengaluru",
        address="Knowledge Park, Electronic City, Bengaluru 560100",
        established_year=2016
    )
    db.add_all([inst1, inst2, inst3])
    db.commit()

    print("Seeding Demonstration Users (5 Roles)...")
    users = [
        User(
            email="admin@institution.edu",
            full_name="Dr. Rajesh Sharma",
            hashed_password=hash_password("Admin@123"),
            role="College Administrator",
            institution_id=inst1.id,
            department="Central Administration",
            is_active=True
        ),
        User(
            email="faculty.cs@institution.edu",
            full_name="Prof. Sunita Verma",
            hashed_password=hash_password("Faculty@123"),
            role="Department Coordinator",
            institution_id=inst1.id,
            department="Computer Science & Engineering",
            is_active=True
        ),
        User(
            email="officer@aicte.gov.in",
            full_name="Anil Kumar (Reviewing Officer)",
            hashed_password=hash_password("Officer@123"),
            role="AICTE Reviewing Officer",
            institution_id=None,
            department="Northern Regional Office (NRO)",
            is_active=True
        ),
        User(
            email="senior@aicte.gov.in",
            full_name="Dr. Manju Pattnaik (Approving Authority)",
            hashed_password=hash_password("Senior@123"),
            role="Senior Approving Authority",
            institution_id=None,
            department="AICTE Approval Bureau",
            is_active=True
        ),
        User(
            email="auditor@qualitycouncil.org",
            full_name="Siddharth Roy (Senior Auditor)",
            hashed_password=hash_password("Auditor@123"),
            role="Auditor",
            institution_id=None,
            department="National Quality Assurance Cell",
            is_active=True
        ),
    ]
    db.add_all(users)
    db.commit()

    officer_user = db.query(User).filter(User.role == "AICTE Reviewing Officer").first()
    admin_user = db.query(User).filter(User.email == "admin@institution.edu").first()

    print("Seeding Compliance Rules (Official AICTE Norms vs Demo Flagged Rules)...")
    rules = [
        ComplianceRule(
            rule_code="RULE-AICTE-001",
            title="Student-Faculty Ratio (SFR) Compliance",
            description="Mandatory 1:20 Student-to-Faculty ratio for Undergraduate Engineering & Technology programs.",
            official_source_title="AICTE Approval Process Handbook (APH 2024-27)",
            official_source_url="https://www.aicte-india.org/approval/aph",
            clause_reference="Clause 7.1 & Appendix 7",
            page_reference="Page 112",
            rule_version="APH 2024-27",
            is_officially_verified=True,
            effective_date="2024-04-01",
            applicable_category="Engineering & Technology (UG)",
            severity="Critical",
            status="Active",
            validation_logic_type="sfr_check"
        ),
        ComplianceRule(
            rule_code="RULE-AICTE-002",
            title="Faculty Cadre Ratio (1:2:6)",
            description="Prescribed cadre distribution of Professor : Associate Professor : Assistant Professor in 1:2:6 ratio.",
            official_source_title="AICTE Approval Process Handbook (APH 2024-27)",
            official_source_url="https://www.aicte-india.org/approval/aph",
            clause_reference="Appendix 7 Norms",
            page_reference="Page 115",
            rule_version="APH 2024-27",
            is_officially_verified=True,
            effective_date="2024-04-01",
            applicable_category="Technical Institutions",
            severity="High",
            status="Active",
            validation_logic_type="cadre_ratio"
        ),
        ComplianceRule(
            rule_code="RULE-AICTE-003",
            title="Principal / Director Ph.D. Qualification",
            description="Principal/Director must hold an earned doctorate (Ph.D.) in appropriate discipline with first class in Bachelor's or Master's.",
            official_source_title="AICTE Regulations on Minimum Qualifications",
            official_source_url="https://www.aicte-india.org/regulations",
            clause_reference="Regulation 3.2(a)",
            page_reference="Page 18",
            rule_version="Gazette 2019 / APH 2024-27",
            is_officially_verified=True,
            effective_date="2019-03-01",
            applicable_category="All Technical Institutions",
            severity="Critical",
            status="Active",
            validation_logic_type="principal_qualification"
        ),
        ComplianceRule(
            rule_code="RULE-AICTE-004",
            title="State Fire Services Safety NOC Validity",
            description="Institution must possess a valid, non-expired Fire Safety NOC issued by the State Fire Services Department.",
            official_source_title="AICTE Approval Process Handbook (APH 2024-27)",
            official_source_url="https://www.aicte-india.org/approval/aph",
            clause_reference="Chapter I Clause 1.4",
            page_reference="Page 24",
            rule_version="APH 2024-27",
            is_officially_verified=True,
            effective_date="2024-04-01",
            applicable_category="All Campus Premises",
            severity="Critical",
            status="Active",
            validation_logic_type="fire_noc_validity"
        ),
        ComplianceRule(
            rule_code="RULE-AICTE-005",
            title="Mandatory Contiguous Land Requirement",
            description="Minimum 2.5 acres in Urban Mega/Metro areas or 7.5 acres in Rural areas in single contiguous parcel.",
            official_source_title="AICTE Approval Process Handbook (APH 2024-27)",
            official_source_url="https://www.aicte-india.org/approval/aph",
            clause_reference="Appendix 4 Land Norms",
            page_reference="Page 89",
            rule_version="APH 2024-27",
            is_officially_verified=True,
            effective_date="2024-04-01",
            applicable_category="Engineering / Technology",
            severity="Critical",
            status="Active",
            validation_logic_type="land_area"
        ),
        ComplianceRule(
            rule_code="RULE-AICTE-006",
            title="Student Grievance Redressal Committee (SGRC)",
            description="Mandatory constitution of SGRC with appointment of Ombudsperson as per statutory AICTE regulations.",
            official_source_title="AICTE Redressal of Grievance of Students Regulations",
            official_source_url="https://www.aicte-india.org",
            clause_reference="Clause 6.3",
            page_reference="Page 4",
            rule_version="Gazette 2019",
            is_officially_verified=True,
            effective_date="2019-11-07",
            applicable_category="All Institutions",
            severity="Medium",
            status="Active",
            validation_logic_type="grievance_committee"
        ),
        ComplianceRule(
            rule_code="RULE-AICTE-007",
            title="Mandatory Anti-Ragging Committee",
            description="Establishment and annual notification of Anti-Ragging Committee and Anti-Ragging Squad with helpline numbers.",
            official_source_title="AICTE Prevention and Prohibition of Ragging Regulations",
            official_source_url="https://www.aicte-india.org",
            clause_reference="Clause 6(a)",
            page_reference="Page 8",
            rule_version="Regulation 2009",
            is_officially_verified=True,
            effective_date="2009-07-01",
            applicable_category="All Institutions",
            severity="High",
            status="Active",
            validation_logic_type="anti_ragging"
        ),
        ComplianceRule(
            rule_code="RULE-DEMO-001",
            title="High-Speed Digital Computing Bandwidth (Demo Norm)",
            description="[Demo Rule — Not Officially Verified] Recommended 500 Mbps dedicated leased line for AI & Cloud labs.",
            official_source_title="SIH 2026 Demonstration Rule Set",
            official_source_url=None,
            clause_reference="Demo Spec 4.2",
            page_reference="Demo Annex 2",
            rule_version="DEMO-2026",
            is_officially_verified=False,
            effective_date="2026-01-01",
            applicable_category="Engineering Institutions",
            severity="Low",
            status="Active",
            validation_logic_type="demo_bandwidth"
        ),
        ComplianceRule(
            rule_code="RULE-DEMO-002",
            title="Campus Renewable Solar Energy Quota (Demo Norm)",
            description="[Demo Rule — Not Officially Verified] Recommended 15% campus electricity generation via rooftop solar photovoltaic.",
            official_source_title="SIH 2026 Demonstration Rule Set",
            official_source_url=None,
            clause_reference="Demo Spec 8.1",
            page_reference="Demo Annex 5",
            rule_version="DEMO-2026",
            is_officially_verified=False,
            effective_date="2026-01-01",
            applicable_category="All Institutions",
            severity="Low",
            status="Active",
            validation_logic_type="demo_solar"
        )
    ]
    db.add_all(rules)
    db.commit()

    print("Seeding Sample Applications...")
    # App 1: Draft / Active Verification (National Institute of Technology & Science)
    app1 = Application(
        application_number="AICTE-2026-1-39201928-001",
        institution_id=inst1.id,
        academic_year="2026-2027",
        application_type="Extension of Approval",
        workflow_stage="Document Validation",
        compliance_status="Potential Gap Detected",
        internal_readiness_score=68.5,
        deadline=utcnow() + datetime.timedelta(days=12),
        assigned_officer_id=officer_user.id,
        created_at=utcnow() - datetime.timedelta(days=5)
    )

    # App 2: Officer Review (Apex Institute)
    app2 = Application(
        application_number="AICTE-2026-1-84920412-002",
        institution_id=inst2.id,
        academic_year="2026-2027",
        application_type="New Course",
        workflow_stage="Officer Review",
        compliance_status="Verification Required",
        internal_readiness_score=85.0,
        deadline=utcnow() + datetime.timedelta(days=6),
        assigned_officer_id=officer_user.id,
        decision_notes="Reviewing Officer notes: Land and Fire NOC inspected. Faculty cadre clarification submitted.",
        created_at=utcnow() - datetime.timedelta(days=15)
    )

    # App 3: Recommended for Decision (Global Institute of Pharmacy)
    app3 = Application(
        application_number="AICTE-2026-1-71930219-003",
        institution_id=inst3.id,
        academic_year="2026-2027",
        application_type="Intake Change",
        workflow_stage="Recommended for Decision",
        compliance_status="Compliant Against Configured Rules",
        internal_readiness_score=94.2,
        deadline=utcnow() + datetime.timedelta(days=3),
        assigned_officer_id=officer_user.id,
        decision_notes="Regional Office Recommendation: All statutory parameters and lab norms satisfied. Recommended for approval.",
        created_at=utcnow() - datetime.timedelta(days=22)
    )

    # App 4: Approved (National Institute - Previous Year)
    app4 = Application(
        application_number="AICTE-2025-1-39201928-088",
        institution_id=inst1.id,
        academic_year="2025-2026",
        application_type="Extension of Approval",
        workflow_stage="Approved",
        compliance_status="Compliant Against Configured Rules",
        internal_readiness_score=98.0,
        assigned_officer_id=officer_user.id,
        decision_notes="Approved by Senior Authority Dr. Manju Pattnaik. Approval letter dispatched.",
        decision_date=utcnow() - datetime.timedelta(days=200),
        created_at=utcnow() - datetime.timedelta(days=250)
    )

    db.add_all([app1, app2, app3, app4])
    db.commit()

    print("Seeding Courses for Applications...")
    courses = [
        ApplicationCourse(
            application_id=app1.id,
            course_name="B.Tech Computer Science & Engineering",
            department="Computer Science",
            level="UG",
            approved_intake=180,
            requested_intake=180,
            faculty_count=8, # SFR Deficit: 720 students / 8 faculty = 90:1
            student_count=720
        ),
        ApplicationCourse(
            application_id=app1.id,
            course_name="B.Tech Artificial Intelligence & Data Science",
            department="Computer Science",
            level="UG",
            approved_intake=60,
            requested_intake=60,
            faculty_count=3,
            student_count=240
        ),
        ApplicationCourse(
            application_id=app2.id,
            course_name="B.Tech Mechanical Engineering",
            department="Mechanical Engineering",
            level="UG",
            approved_intake=60,
            requested_intake=60,
            faculty_count=6,
            student_count=240
        ),
        ApplicationCourse(
            application_id=app3.id,
            course_name="Bachelor of Pharmacy (B.Pharm)",
            department="Pharmaceutical Sciences",
            level="UG",
            approved_intake=100,
            requested_intake=100,
            faculty_count=18,
            student_count=360
        )
    ]
    db.add_all(courses)
    db.commit()

    print("Creating Sample Documents and Extracted Fields...")
    # Create sample physical text file on disk for mock processing
    sample_file_path = os.path.join(settings.UPLOAD_DIR, "sample_fire_noc.txt")
    with open(sample_file_path, "w", encoding="utf-8") as f:
        f.write(
            "GOVERNMENT OF NCT OF DELHI - STATE FIRE SERVICES\n"
            "HEADQUARTERS: CONNAUGHT PLACE, NEW DELHI\n\n"
            "FIRE SAFETY CLEARANCE CERTIFICATE (NOC)\n"
            "Certificate No: DFS/MS/2023/SZ/1942\n"
            "Date of Issue: 15/01/2023\n"
            "Institution Name: National Engineering College\n" # Intentional name mismatch vs registered name!
            "Institution Code: 1-39201928\n"
            "Premises: Sector 5, Dwarka, New Delhi 110078\n"
            "Total Land Area: 3.20 Acres\n"
            "Valid Till: 14/01/2024\n" # Expired date!
            "Issued By: Chief Fire Officer (Southern Region)\n"
        )

    doc_fire = Document(
        application_id=app1.id,
        institution_id=inst1.id,
        document_type="Fire Safety NOC",
        file_name="Delhi_Fire_Services_NOC_2023.pdf",
        file_path=sample_file_path,
        file_size=2048,
        mime_type="application/pdf",
        sha256_checksum="7d5b83908f237f374e50882e9b89c30f40d862e3d368b6b1fc9a7d3a0429f427",
        status="Extracted",
        extraction_confidence=0.91,
        authenticity_status="Authenticity not independently verified",
        uploader_id=admin_user.id,
        version=1,
        created_at=utcnow() - datetime.timedelta(days=4)
    )

    doc_land = Document(
        application_id=app1.id,
        institution_id=inst1.id,
        document_type="Land Title Certificate",
        file_name="Registered_Sale_Deed_Land_Plot5.pdf",
        file_path=sample_file_path,
        file_size=4096,
        mime_type="application/pdf",
        sha256_checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        status="Extracted",
        extraction_confidence=0.94,
        authenticity_status="Authenticity not independently verified",
        uploader_id=admin_user.id,
        version=1,
        created_at=utcnow() - datetime.timedelta(days=4)
    )

    doc_principal = Document(
        application_id=app1.id,
        institution_id=inst1.id,
        document_type="Principal Appointment & Qualification",
        file_name="Principal_PhD_Degree_Ratification.pdf",
        file_path=sample_file_path,
        file_size=1024,
        mime_type="application/pdf",
        sha256_checksum="a89bc21356e9c991d348a7b1b3699c277efd56b02a29c362140bb23b7194602f",
        status="Extracted",
        extraction_confidence=0.95,
        authenticity_status="Authenticity not independently verified",
        uploader_id=admin_user.id,
        version=1,
        created_at=utcnow() - datetime.timedelta(days=4)
    )

    db.add_all([doc_fire, doc_land, doc_principal])
    db.commit()

    # Extracted fields for doc_fire
    ef1 = ExtractedField(document_id=doc_fire.id, field_name="institution_name", field_value="National Engineering College", field_type="string", confidence=0.92)
    ef2 = ExtractedField(document_id=doc_fire.id, field_name="institution_code", field_value="1-39201928", field_type="string", confidence=0.98)
    ef3 = ExtractedField(document_id=doc_fire.id, field_name="expiry_date", field_value="14/01/2024", field_type="date", confidence=0.91)
    ef4 = ExtractedField(document_id=doc_fire.id, field_name="issuing_authority", field_value="Chief Fire Officer, Delhi Fire Services", field_type="string", confidence=0.89)

    # Extracted fields for doc_land
    ef5 = ExtractedField(document_id=doc_land.id, field_name="institution_name", field_value="National Institute of Technology & Science", field_type="string", confidence=0.96)
    ef6 = ExtractedField(document_id=doc_land.id, field_name="land_area_acres", field_value="3.20", field_type="number", confidence=0.94)
    ef7 = ExtractedField(document_id=doc_land.id, field_name="ownership_type", field_value="Freehold", field_type="string", confidence=0.95)

    # Extracted fields for doc_principal
    ef8 = ExtractedField(document_id=doc_principal.id, field_name="principal_name", field_value="Dr. Rajesh Sharma", field_type="string", confidence=0.97)
    ef9 = ExtractedField(document_id=doc_principal.id, field_name="highest_qualification", field_value="PHD", field_type="string", confidence=0.98)

    db.add_all([ef1, ef2, ef3, ef4, ef5, ef6, ef7, ef8, ef9])
    db.commit()

    print("Seeding Compliance Findings & Cross-Document Mismatches...")
    rule_sfr = db.query(ComplianceRule).filter(ComplianceRule.rule_code == "RULE-AICTE-001").first()
    rule_fire = db.query(ComplianceRule).filter(ComplianceRule.rule_code == "RULE-AICTE-004").first()
    rule_grievance = db.query(ComplianceRule).filter(ComplianceRule.rule_code == "RULE-AICTE-006").first()

    finding1 = ComplianceFinding(
        application_id=app1.id,
        rule_id=rule_sfr.id,
        finding_category="Ratio Non-Compliance",
        severity="Critical",
        title="Student-Faculty Ratio Deficit (87.2:1)",
        description="Current SFR is 87.2:1 (960 total students across CSE & AI vs 11 recorded faculty). Mandated AICTE ratio is 1:20.",
        conflicting_values={"declared_sfr": "87.2:1", "mandated_norm": "1:20", "deficit_faculty_count": 37},
        evidence_reference="APH 2024-27 Clause 7.1",
        suggested_action="Recruit additional regular teaching faculty or adjust approved intake capacity.",
        status="Open",
        created_at=utcnow() - datetime.timedelta(days=2)
    )

    finding2 = ComplianceFinding(
        application_id=app1.id,
        rule_id=rule_fire.id,
        finding_category="Expired Certificate",
        severity="Critical",
        title="Fire Safety Clearance Certificate Expired",
        description="The uploaded Fire NOC (Delhi_Fire_Services_NOC_2023.pdf) shows validity expired on 14/01/2024.",
        conflicting_values={"document_expiry_date": "14/01/2024", "current_year": "2026"},
        evidence_reference=f"Document #{doc_fire.id}: 'Delhi_Fire_Services_NOC_2023.pdf'",
        suggested_action="Upload an updated Fire Safety Certificate renewal issued by Delhi Fire Services.",
        status="Open",
        created_at=utcnow() - datetime.timedelta(days=2)
    )

    finding3 = ComplianceFinding(
        application_id=app1.id,
        rule_id=rule_fire.id,
        finding_category="Cross-Doc Mismatch",
        severity="High",
        title="Institution Name Inconsistency in Fire NOC",
        description="Extracted name 'National Engineering College' in Fire NOC conflicts with registered name 'National Institute of Technology & Science'.",
        conflicting_values={
            "registered_institution_name": "National Institute of Technology & Science",
            "document_extracted_name": "National Engineering College"
        },
        evidence_reference=f"Document #{doc_fire.id}: 'Delhi_Fire_Services_NOC_2023.pdf'",
        suggested_action="Verify if the Fire NOC belongs to an old alias or if an official name change gazette is required.",
        status="Open",
        created_at=utcnow() - datetime.timedelta(days=2)
    )

    finding4 = ComplianceFinding(
        application_id=app1.id,
        rule_id=rule_grievance.id,
        finding_category="Missing Document",
        severity="Medium",
        title="Student Grievance Redressal Committee Order Missing",
        description="Official notification establishing SGRC along with appointed ombudsperson not uploaded.",
        evidence_reference="AICTE Regulations Clause 6.3",
        suggested_action="Upload signed office memorandum establishing the institutional SGRC.",
        status="Open",
        created_at=utcnow() - datetime.timedelta(days=2)
    )

    db.add_all([finding1, finding2, finding3, finding4])
    db.commit()

    print("Seeding Corrective Tasks...")
    task1 = Task(
        application_id=app1.id,
        finding_id=finding2.id,
        title="Obtain & Upload Renewed Fire Safety NOC",
        description="Fire NOC expired in Jan 2024. Submit renewal application receipt or updated valid certificate from Delhi Fire Services.",
        department="Estate & Facilities",
        priority="Critical",
        status="In Progress",
        due_date=utcnow() + datetime.timedelta(days=4),
        assigned_to_id=admin_user.id,
        created_by_id=admin_user.id,
        created_at=utcnow() - datetime.timedelta(days=2)
    )

    task2 = Task(
        application_id=app1.id,
        finding_id=finding1.id,
        title="Faculty Recruitment Drive for CSE & AI Departments",
        description="Prepare appointment roster for 12 Assistant Professors and 4 Associate Professors to satisfy AICTE 1:20 SFR.",
        department="Academic Affairs",
        priority="Critical",
        status="Open",
        due_date=utcnow() + datetime.timedelta(days=8),
        assigned_to_id=admin_user.id,
        created_by_id=admin_user.id,
        created_at=utcnow() - datetime.timedelta(days=2)
    )

    task3 = Task(
        application_id=app1.id,
        finding_id=finding4.id,
        title="Upload Office Order for Student Grievance Redressal (SGRC)",
        description="Obtain Vice Chancellor / Director signature on reconstituted SGRC notification and upload to compliance portal.",
        department="Student Welfare",
        priority="Medium",
        status="Open",
        due_date=utcnow() + datetime.timedelta(days=10),
        assigned_to_id=admin_user.id,
        created_by_id=admin_user.id,
        created_at=utcnow() - datetime.timedelta(days=1)
    )

    db.add_all([task1, task2, task3])
    db.commit()

    # Task comment
    tc1 = TaskComment(
        task_id=task1.id,
        user_id=admin_user.id,
        comment_text="Inspection scheduled by Fire Officer on Friday. Will upload interim acknowledgment receipt tomorrow.",
        created_at=utcnow() - datetime.timedelta(hours=14)
    )
    db.add(tc1)
    db.commit()

    print("Seeding Alerts & Deadline Notifications...")
    alerts = [
        Alert(
            user_id=admin_user.id,
            target_role="College Administrator",
            application_id=app1.id,
            alert_type="Critical Finding",
            title="Action Required: Expired Fire Safety Certificate",
            message="Application #AICTE-2026-1-39201928-001 flagged with Critical Fire Safety gap. SLA deadline approaching in 4 days.",
            severity="Critical",
            is_read=False,
            is_acknowledged=False,
            created_at=utcnow() - datetime.timedelta(hours=6)
        ),
        Alert(
            user_id=admin_user.id,
            target_role="College Administrator",
            application_id=app1.id,
            alert_type="Upcoming Deadline",
            title="Document Verification Window Closes in 12 Days",
            message="Statutory submission cycle ends on 15 Nov 2026. Complete pending corrective tasks to avoid review return.",
            severity="High",
            is_read=False,
            is_acknowledged=False,
            created_at=utcnow() - datetime.timedelta(hours=18)
        ),
        Alert(
            user_id=officer_user.id,
            target_role="AICTE Reviewing Officer",
            application_id=app2.id,
            alert_type="Application Awaiting Review",
            title="Application #AICTE-2026-1-84920412-002 Ready for Inspection",
            message="Apex Institute of Engineering has submitted clarification dossier for New Course approval.",
            severity="Medium",
            is_read=False,
            is_acknowledged=False,
            created_at=utcnow() - datetime.timedelta(hours=2)
        )
    ]
    db.add_all(alerts)
    db.commit()

    print("Seeding Regulatory Sources & Rule Change Radar...")
    source_aph = RegulatorySource(
        title="AICTE Approval Process Handbook (APH)",
        document_code="AICTE-APH-MAIN",
        source_url="https://www.aicte-india.org/approval/aph",
        current_version="APH 2024-27",
        publication_date="2024-03-25",
        effective_date="2024-04-01",
        verification_status="Verified Applicable"
    )
    db.add(source_aph)
    db.commit()

    v_old_text = (
        "AICTE APPROVAL PROCESS HANDBOOK 2023-2024\n"
        "CHAPTER VII: NORMS FOR FACULTY AND STAFF REQUIREMENTS\n"
        "Clause 7.1: The Student Faculty Ratio (SFR) for Engineering & Technology shall be 1:15 for UG programs.\n"
        "Clause 7.2: For calculation of SFR, Adjunct Faculty shall not exceed 10% of total sanctioned strength.\n"
        "APPENDIX 4: LAND REQUIREMENTS\n"
        "Urban Mega City minimum land requirement: 3.00 Acres contiguous parcel.\n"
    )

    v_new_text = (
        "AICTE APPROVAL PROCESS HANDBOOK 2024-2027\n"
        "CHAPTER VII: NORMS FOR FACULTY AND STAFF REQUIREMENTS\n"
        "Clause 7.1: The Student Faculty Ratio (SFR) for Engineering & Technology shall be relaxed to 1:20 for UG programs.\n"
        "Clause 7.2: For calculation of SFR, Adjunct/Emeritus Faculty and Industry Professionals up to 20% are permitted.\n"
        "APPENDIX 4: LAND REQUIREMENTS\n"
        "Urban Mega City minimum land requirement: 2.50 Acres contiguous parcel (Relaxed from 3.0 Acres).\n"
    )

    v1 = RegulatoryDocumentVersion(
        source_id=source_aph.id,
        version_tag="APH 2023-24",
        file_name="AICTE_APH_2023_24_Official.pdf",
        file_path="mock_path_aph_2023.pdf",
        parsed_text=v_old_text,
        is_active=False,
        created_at=utcnow() - datetime.timedelta(days=365)
    )
    v2 = RegulatoryDocumentVersion(
        source_id=source_aph.id,
        version_tag="APH 2024-27",
        file_name="AICTE_APH_2024_27_Gazette.pdf",
        file_path="mock_path_aph_2024.pdf",
        parsed_text=v_new_text,
        is_active=True,
        created_at=utcnow() - datetime.timedelta(days=120)
    )
    db.add_all([v1, v2])
    db.commit()

    radar_event = RuleChangeEvent(
        source_id=source_aph.id,
        old_version="APH 2023-24",
        new_version="APH 2024-27",
        section_reference="Chapter VII Clause 7.1 & Appendix 4",
        change_summary="Relaxation of Undergraduate Engineering SFR norm from 1:15 to 1:20, and Urban Land norm from 3.0 to 2.5 Acres.",
        impact_analysis="Positively impacts technical institutions by expanding permissible student intake capacity and easing urban land zoning hurdles.",
        affected_rule_ids=["RULE-AICTE-001", "RULE-AICTE-005"],
        affected_application_ids=["AICTE-2026-1-39201928-001", "AICTE-2026-1-84920412-002"],
        status="Pending Human Review",
        created_at=utcnow() - datetime.timedelta(days=3)
    )
    db.add(radar_event)
    db.commit()

    print("Seeding Audit Trail Events...")
    audit_events = [
        AuditEvent(
            actor_email="admin@institution.edu",
            actor_role="College Administrator",
            action="APPLICATION_CREATED",
            entity_type="Application",
            entity_id=str(app1.id),
            change_summary="Created Application #AICTE-2026-1-39201928-001 (Extension of Approval).",
            correlation_id="INIT-001",
            timestamp=utcnow() - datetime.timedelta(days=5)
        ),
        AuditEvent(
            actor_email="admin@institution.edu",
            actor_role="College Administrator",
            action="DOCUMENT_UPLOADED",
            entity_type="Document",
            entity_id=str(doc_fire.id),
            change_summary="Uploaded 'Delhi_Fire_Services_NOC_2023.pdf' with SHA-256 integrity hash.",
            correlation_id="DOC-991",
            timestamp=utcnow() - datetime.timedelta(days=4)
        ),
        AuditEvent(
            actor_email="admin@institution.edu",
            actor_role="College Administrator",
            action="COMPLIANCE_RUN_TRIGGERED",
            entity_type="Application",
            entity_id=str(app1.id),
            change_summary="Compliance Engine evaluated 9 rules. 4 potential gaps detected.",
            correlation_id="COMP-410",
            timestamp=utcnow() - datetime.timedelta(days=2)
        )
    ]
    db.add_all(audit_events)
    db.commit()

    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
