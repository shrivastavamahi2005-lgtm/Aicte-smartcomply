import os
import hashlib
import re
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
import fitz # PyMuPDF
from app.models.entities import Document, DocumentVersion, ExtractedField, User
from app.services.audit_service import log_audit_event

def calculate_sha256(file_path: str) -> str:
    """Calculates SHA-256 checksum for document integrity tracking."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts raw text from PDF file using PyMuPDF."""
    text_content = []
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            text_content.append(page.get_text())
        doc.close()
    except Exception as e:
        print(f"PyMuPDF extraction error: {e}")
        text_content.append(f"[Text extraction error: {str(e)}]")
    return "\n--- PAGE BREAK ---\n".join(text_content)

def extract_structured_fields(document_type: str, text: str) -> List[Dict[str, Any]]:
    """
    Extracts structured domain fields from document text using pattern matchers and regulatory layout heuristics.
    Tracks extraction confidence.
    """
    fields = []

    # Common field: Institution Name
    inst_name_match = re.search(r"(?:Institution\s*(?:Name)?|College\s*Name|Institute\s*Name)\s*[:\-]?\s*([A-Za-z0-9\s,\.]{5,80})", text, re.IGNORECASE)
    if inst_name_match:
        val = inst_name_match.group(1).split("\n")[0].strip()
        fields.append({
            "field_name": "institution_name",
            "field_value": val,
            "field_type": "string",
            "confidence": 0.92
        })
    else:
        fields.append({
            "field_name": "institution_name",
            "field_value": "Needs review",
            "field_type": "string",
            "confidence": 0.40
        })

    # Common field: Institution Code / AICTE Permanent ID
    inst_code_match = re.search(r"(?:Institution\s*Code|AICTE\s*ID|PID|Permanent\s*Institute\s*ID)\s*[:\-]?\s*([0-9\-\/A-Z]{3,20})", text, re.IGNORECASE)
    if inst_code_match:
        val = inst_code_match.group(1).strip()
        fields.append({
            "field_name": "institution_code",
            "field_value": val,
            "field_type": "string",
            "confidence": 0.95
        })

    # Type specific extraction
    if "fire" in document_type.lower() or "noc" in document_type.lower():
        # Expiry date
        expiry_match = re.search(r"(?:Valid\s*(?:Up\s*To|Till|Until)|Expiry\s*Date|Valid\s*Through)\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})", text, re.IGNORECASE)
        if expiry_match:
            fields.append({
                "field_name": "expiry_date",
                "field_value": expiry_match.group(1).strip(),
                "field_type": "date",
                "confidence": 0.91
            })
        else:
            fields.append({
                "field_name": "expiry_date",
                "field_value": "Needs review",
                "field_type": "date",
                "confidence": 0.35
            })

        # Issuing Authority
        authority_match = re.search(r"(?:Issued\s*By|Office\s*Of|Authority)\s*[:\-]?\s*([A-Za-z\s,\.]{5,60})", text, re.IGNORECASE)
        if authority_match:
            fields.append({
                "field_name": "issuing_authority",
                "field_value": authority_match.group(1).split("\n")[0].strip(),
                "field_type": "string",
                "confidence": 0.88
            })

    elif "land" in document_type.lower():
        # Land area in acres
        area_match = re.search(r"(?:Total\s*Land\s*Area|Land\s*Area|Area\s*in\s*Acres)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:Acres|acre|Hectares)?", text, re.IGNORECASE)
        if area_match:
            fields.append({
                "field_name": "land_area_acres",
                "field_value": area_match.group(1).strip(),
                "field_type": "number",
                "confidence": 0.94
            })
        else:
            fields.append({
                "field_name": "land_area_acres",
                "field_value": "Needs review",
                "field_type": "number",
                "confidence": 0.40
            })

        # Ownership type (Leasehold or Freehold)
        ownership_match = re.search(r"(Leasehold|Freehold|Ownership|Govt\s*Allotted)", text, re.IGNORECASE)
        if ownership_match:
            fields.append({
                "field_name": "ownership_type",
                "field_value": ownership_match.group(1).capitalize(),
                "field_type": "string",
                "confidence": 0.89
            })

    elif "faculty" in document_type.lower() or "roster" in document_type.lower():
        # Total faculty count
        count_match = re.search(r"(?:Total\s*Faculty|Total\s*Teachers|Faculty\s*Count)\s*[:\-]?\s*([0-9]{1,4})", text, re.IGNORECASE)
        if count_match:
            fields.append({
                "field_name": "total_faculty",
                "field_value": count_match.group(1).strip(),
                "field_type": "number",
                "confidence": 0.90
            })
        
        # Ph.D. faculty count
        phd_match = re.search(r"(?:Ph\.?D\.?\s*Holders?|Doctorate\s*Count)\s*[:\-]?\s*([0-9]{1,3})", text, re.IGNORECASE)
        if phd_match:
            fields.append({
                "field_name": "phd_faculty_count",
                "field_value": phd_match.group(1).strip(),
                "field_type": "number",
                "confidence": 0.88
            })

    elif "principal" in document_type.lower():
        # Principal name
        p_name = re.search(r"(?:Principal\s*Name|Director\s*Name|Dr\.\s*[A-Za-z\s]+)\s*[:\-]?\s*([A-Za-z\s\.]{4,50})", text, re.IGNORECASE)
        if p_name:
            fields.append({
                "field_name": "principal_name",
                "field_value": p_name.group(1).split("\n")[0].strip(),
                "field_type": "string",
                "confidence": 0.93
            })
        
        # Qualification (Ph.D. / M.Tech)
        qual_match = re.search(r"(Ph\.?D|M\.?Tech|Master\s*of\s*Engineering)", text, re.IGNORECASE)
        if qual_match:
            fields.append({
                "field_name": "highest_qualification",
                "field_value": qual_match.group(1).upper().replace(".", ""),
                "field_type": "string",
                "confidence": 0.96
            })

    return fields

def process_document_pipeline(db: Session, document: Document, actor_user: User) -> Document:
    """Executes the extraction and structuring pipeline for an uploaded document."""
    document.status = "Processing"
    db.commit()

    # Step 1: Calculate SHA-256
    document.sha256_checksum = calculate_sha256(document.file_path)

    # Step 2: Extract text
    if document.mime_type == "application/pdf" or document.file_name.lower().endswith(".pdf"):
        extracted_text = extract_text_from_pdf(document.file_path)
    else:
        # Fallback text reading for txt/csv/etc
        try:
            with open(document.file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()
        except Exception:
            extracted_text = f"[Binary Document Content - SHA-256: {document.sha256_checksum}]"

    document.extracted_text = extracted_text

    # Step 3: Structured field extraction
    extracted_items = extract_structured_fields(document.document_type, extracted_text)

    # Remove previous auto-extracted fields for this document
    db.query(ExtractedField).filter(ExtractedField.document_id == document.id).delete()

    confidences = []
    for item in extracted_items:
        field = ExtractedField(
            document_id=document.id,
            field_name=item["field_name"],
            field_value=item["field_value"],
            field_type=item["field_type"],
            confidence=item["confidence"],
            is_manually_corrected=False,
            original_value=item["field_value"]
        )
        db.add(field)
        confidences.append(item["confidence"])

    avg_conf = sum(confidences) / len(confidences) if confidences else 0.8
    document.extraction_confidence = round(avg_conf, 2)
    document.status = "Extracted"
    document.authenticity_status = "Authenticity not independently verified" # Explicit disclaimer per SIH requirements
    db.commit()

    log_audit_event(
        db=db,
        actor_email=actor_user.email,
        actor_role=actor_user.role,
        action="DOCUMENT_EXTRACTED",
        entity_type="Document",
        entity_id=document.id,
        change_summary=f"Processed '{document.file_name}' ({document.document_type}). Extracted {len(extracted_items)} fields with avg confidence {document.extraction_confidence}."
    )

    return document
