from typing import List, Dict, Any
from datetime import datetime
import re
from sqlalchemy.orm import Session
from app.models.entities import Application, Document, ExtractedField, ComplianceFinding, ComplianceRule

def normalize_text(text: str) -> str:
    """Normalizes string for robust comparison by removing special chars and extra spaces."""
    if not text:
        return ""
    text = re.sub(r"[^\w\s]", "", text)
    return " ".join(text.lower().split())

def detect_cross_document_mismatches(db: Session, application: Application) -> List[Dict[str, Any]]:
    """
    Scans extracted fields across all documents linked to an application and correlates them
    to detect cross-document inconsistencies, expired records, and conflicting declarations.
    """
    mismatches = []
    registered_inst_name = application.institution.name
    registered_inst_code = application.institution.code

    documents = db.query(Document).filter(Document.application_id == application.id).all()
    doc_fields_map: Dict[int, Dict[str, str]] = {}
    doc_meta_map: Dict[int, Document] = {}

    for doc in documents:
        doc_meta_map[doc.id] = doc
        doc_fields_map[doc.id] = {}
        for ef in doc.extracted_fields:
            if ef.field_value and ef.field_value not in ["Needs review", "Unknown"]:
                doc_fields_map[doc.id][ef.field_name] = ef.field_value

    # 1. Institution Name Inconsistency across documents vs application record
    for doc_id, fields in doc_fields_map.items():
        doc = doc_meta_map[doc_id]
        if "institution_name" in fields:
            extracted_name = fields["institution_name"]
            norm_extracted = normalize_text(extracted_name)
            norm_registered = normalize_text(registered_inst_name)

            # Check if key tokens match
            if norm_extracted and norm_registered and norm_extracted not in norm_registered and norm_registered not in norm_extracted:
                mismatches.append({
                    "finding_category": "Cross-Doc Mismatch",
                    "severity": "High",
                    "title": f"Institution Name Inconsistency in {doc.document_type}",
                    "description": (
                        f"Extracted institution name '{extracted_name}' in document '{doc.file_name}' "
                        f"conflicts with registered institution name '{registered_inst_name}'."
                    ),
                    "conflicting_values": {
                        "registered_institution_name": registered_inst_name,
                        "document_extracted_name": extracted_name,
                        "document_id": doc.id,
                        "document_file": doc.file_name
                    },
                    "evidence_reference": f"Document ID #{doc.id}: '{doc.file_name}'",
                    "suggested_action": "Verify if the uploaded certificate belongs to another campus or if an official name change affidavit is required."
                })

        # 2. Institution Permanent ID mismatch
        if "institution_code" in fields:
            extracted_code = fields["institution_code"]
            if extracted_code and extracted_code != registered_inst_code:
                mismatches.append({
                    "finding_category": "Cross-Doc Mismatch",
                    "severity": "Critical",
                    "title": f"Permanent Institute ID Conflict in {doc.document_type}",
                    "description": (
                        f"Extracted AICTE PID '{extracted_code}' in document '{doc.file_name}' does not match "
                        f"application's official PID '{registered_inst_code}'."
                    ),
                    "conflicting_values": {
                        "application_pid": registered_inst_code,
                        "document_pid": extracted_code,
                        "document_id": doc.id
                    },
                    "evidence_reference": f"Document #{doc.id}: '{doc.file_name}'",
                    "suggested_action": "Ensure the uploaded document belongs to this specific institute code and not an affiliated trust/entity."
                })

        # 3. Certificate Expiration Check (e.g. Fire NOC, Building Safety)
        if "expiry_date" in fields:
            exp_str = fields["expiry_date"]
            parsed_date = None
            for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d.%m.%Y"):
                try:
                    parsed_date = datetime.strptime(exp_str, fmt)
                    break
                except ValueError:
                    continue

            if parsed_date:
                now = datetime.now()
                if parsed_date < now:
                    mismatches.append({
                        "finding_category": "Expired Certificate",
                        "severity": "Critical",
                        "title": f"Expired {doc.document_type} Detected",
                        "description": (
                            f"The {doc.document_type} ('{doc.file_name}') shows validity expired on {exp_str}. "
                            f"Active AICTE approval requires current valid certification."
                        ),
                        "conflicting_values": {
                            "document_expiry_date": exp_str,
                            "current_evaluation_date": now.strftime("%d/%m/%Y")
                        },
                        "evidence_reference": f"Document #{doc.id}: '{doc.file_name}', field: expiry_date",
                        "suggested_action": "Upload an updated renewal certificate or valid inspection extension slip from the statutory authority."
                    })

    # 4. Land Area Discrepancy between Land Certificate and other site/building documents
    land_docs = [d for d in documents if "land" in d.document_type.lower()]
    building_docs = [d for d in documents if "building" in d.document_type.lower() or "safety" in d.document_type.lower()]

    if land_docs and building_docs:
        land_doc_fields = doc_fields_map.get(land_docs[0].id, {})
        bld_doc_fields = doc_fields_map.get(building_docs[0].id, {})
        if "land_area_acres" in land_doc_fields and "land_area_acres" in bld_doc_fields:
            val_a = land_doc_fields["land_area_acres"]
            val_b = bld_doc_fields["land_area_acres"]
            if val_a != val_b:
                mismatches.append({
                    "finding_category": "Cross-Doc Mismatch",
                    "severity": "High",
                    "title": "Discrepancy in Declared Land Area",
                    "description": (
                        f"Land Title specifies {val_a} acres, whereas Building Safety certificate mentions {val_b} acres."
                    ),
                    "conflicting_values": {
                        "land_certificate_area": val_a,
                        "building_safety_area": val_b
                    },
                    "evidence_reference": f"Doc #{land_docs[0].id} vs Doc #{building_docs[0].id}",
                    "suggested_action": "Provide a consolidated architect land certificate clarifying contiguous plot acreage."
                })

    return mismatches
