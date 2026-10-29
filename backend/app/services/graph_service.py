from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Application, Document, ComplianceFinding, Task, ComplianceRule

def build_application_compliance_graph(db: Session, application_id: int) -> Dict[str, Any]:
    """
    Constructs a real graph of interconnected nodes and dependency edges for an application:
    Institution -> Application -> Courses/Documents -> Rules -> Findings -> Tasks.
    Enables root-cause tracing and impact analysis without virtual campus/digital twin elements.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        return {"nodes": [], "edges": []}

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    # Layer X coordinates for clean layout
    # Layer 0: Institution
    # Layer 1: Application
    # Layer 2: Courses & Documents
    # Layer 3: Rules
    # Layer 4: Findings
    # Layer 5: Corrective Tasks

    # 1. Institution Node
    inst = application.institution
    inst_node_id = f"inst_{inst.id}"
    nodes.append({
        "id": inst_node_id,
        "type": "institution",
        "data": {
            "label": inst.name,
            "code": inst.code,
            "state": inst.state,
            "type": inst.institution_type
        },
        "position": {"x": 50, "y": 250}
    })

    # 2. Application Node
    app_node_id = f"app_{application.id}"
    nodes.append({
        "id": app_node_id,
        "type": "application",
        "data": {
            "label": f"App #{application.application_number}",
            "stage": application.workflow_stage,
            "readiness": f"{application.internal_readiness_score}%",
            "status": application.compliance_status
        },
        "position": {"x": 300, "y": 250}
    })
    edges.append({
        "id": f"e_{inst_node_id}_{app_node_id}",
        "source": inst_node_id,
        "target": app_node_id,
        "label": "submits",
        "animated": False
    })

    # 3. Courses Nodes
    y_offset = 50
    for course in application.courses:
        c_node_id = f"course_{course.id}"
        nodes.append({
            "id": c_node_id,
            "type": "course",
            "data": {
                "label": course.course_name,
                "intake": course.approved_intake,
                "faculty": course.faculty_count,
                "students": course.student_count
            },
            "position": {"x": 550, "y": y_offset}
        })
        edges.append({
            "id": f"e_{app_node_id}_{c_node_id}",
            "source": app_node_id,
            "target": c_node_id,
            "label": "offers",
            "animated": False
        })
        y_offset += 120

    # 4. Document Nodes
    doc_y = 50
    doc_nodes_map = {}
    for doc in application.documents:
        doc_node_id = f"doc_{doc.id}"
        doc_nodes_map[doc.id] = doc_node_id
        nodes.append({
            "id": doc_node_id,
            "type": "document",
            "data": {
                "label": doc.document_type,
                "fileName": doc.file_name,
                "status": doc.status,
                "confidence": f"{int(doc.extraction_confidence * 100)}%"
            },
            "position": {"x": 800, "y": doc_y}
        })
        edges.append({
            "id": f"e_{app_node_id}_{doc_node_id}",
            "source": app_node_id,
            "target": doc_node_id,
            "label": "evidence",
            "animated": False
        })
        doc_y += 110

    # 5. Finding Nodes & Linked Rules
    finding_y = 50
    for finding in application.findings:
        f_node_id = f"finding_{finding.id}"
        nodes.append({
            "id": f_node_id,
            "type": "finding",
            "data": {
                "label": finding.title,
                "category": finding.finding_category,
                "severity": finding.severity,
                "status": finding.status
            },
            "position": {"x": 1100, "y": finding_y}
        })

        # Link from rule
        if finding.rule_id:
            rule = db.query(ComplianceRule).filter(ComplianceRule.id == finding.rule_id).first()
            if rule:
                r_node_id = f"rule_{rule.id}"
                if not any(n["id"] == r_node_id for n in nodes):
                    nodes.append({
                        "id": r_node_id,
                        "type": "rule",
                        "data": {
                            "label": rule.rule_code,
                            "title": rule.title,
                            "isVerified": rule.is_officially_verified,
                            "clause": rule.clause_reference
                        },
                        "position": {"x": 1100, "y": max(10, finding_y - 60)}
                    })
                edges.append({
                    "id": f"e_{r_node_id}_{f_node_id}",
                    "source": r_node_id,
                    "target": f_node_id,
                    "label": "triggers",
                    "animated": True
                })

        # Link from affected document if referenced
        for doc in application.documents:
            if doc.document_type.lower() in finding.description.lower() or str(doc.id) in (finding.evidence_reference or ""):
                edges.append({
                    "id": f"e_doc_{doc.id}_{f_node_id}",
                    "source": f"doc_{doc.id}",
                    "target": f_node_id,
                    "label": "inconsistency",
                    "animated": True
                })

        # 6. Corrective Tasks linked to this finding
        task_y = finding_y
        for task in finding.tasks:
            t_node_id = f"task_{task.id}"
            nodes.append({
                "id": t_node_id,
                "type": "task",
                "data": {
                    "label": task.title,
                    "status": task.status,
                    "priority": task.priority,
                    "department": task.department
                },
                "position": {"x": 1380, "y": task_y}
            })
            edges.append({
                "id": f"e_{f_node_id}_{t_node_id}",
                "source": f_node_id,
                "target": t_node_id,
                "label": "resolves",
                "animated": True
            })
            task_y += 100

        finding_y += 140

    return {"nodes": nodes, "edges": edges}
