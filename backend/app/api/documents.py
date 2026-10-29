import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.config import settings
from app.models.entities import Document, DocumentVersion, ExtractedField, Application, User
from app.schemas.schemas import DocumentResponse, ExtractedFieldUpdate, DocumentVersionResponse
from app.services.auth_service import get_current_user, require_roles
from app.services.document_service import process_document_pipeline, calculate_sha256
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".xlsx", ".csv", ".docx", ".txt"}

@router.get("/application/{app_id}", response_model=List[DocumentResponse])
def get_application_documents(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    docs = db.query(Document).filter(Document.application_id == app_id).order_by(Document.created_at.desc()).all()
    return docs

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    application_id: int = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(["College Administrator", "Department Coordinator"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.institution_id and app.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Cannot upload documents for other institutions")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Check for existing document of this type to handle versioning
    existing_doc = db.query(Document).filter(
        Document.application_id == application_id,
        Document.document_type == document_type
    ).first()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{app.id}_{document_type.replace(' ', '_')}_{timestamp}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    checksum = calculate_sha256(file_path)

    if existing_doc:
        # Create version record of previous
        v_num = existing_doc.version
        prev_version = DocumentVersion(
            document_id=existing_doc.id,
            version_number=v_num,
            file_name=existing_doc.file_name,
            file_path=existing_doc.file_path,
            sha256_checksum=existing_doc.sha256_checksum,
            uploaded_by_id=existing_doc.uploader_id,
            change_notes=f"Superseded by version {v_num + 1}",
            created_at=existing_doc.created_at
        )
        db.add(prev_version)

        # Update current document
        existing_doc.file_name = file.filename
        existing_doc.file_path = file_path
        existing_doc.file_size = file_size
        existing_doc.mime_type = file.content_type or "application/octet-stream"
        existing_doc.sha256_checksum = checksum
        existing_doc.version = v_num + 1
        existing_doc.uploader_id = current_user.id
        existing_doc.created_at = datetime.now(timezone.utc)
        target_doc = existing_doc
    else:
        new_doc = Document(
            application_id=application_id,
            institution_id=app.institution_id,
            document_type=document_type,
            file_name=file.filename,
            file_path=file_path,
            file_size=file_size,
            mime_type=file.content_type or "application/octet-stream",
            sha256_checksum=checksum,
            status="Uploaded",
            extraction_confidence=0.0,
            authenticity_status="Authenticity not independently verified",
            uploader_id=current_user.id,
            version=1,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_doc)
        db.flush()
        target_doc = new_doc

    # Process extraction pipeline
    processed_doc = process_document_pipeline(db, target_doc, current_user)
    return processed_doc

@router.put("/fields/{field_id}", response_model=DocumentResponse)
def correct_extracted_field(
    field_id: int,
    req: ExtractedFieldUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    field = db.query(ExtractedField).filter(ExtractedField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Extracted field record not found")

    old_val = field.field_value
    field.field_value = req.field_value
    field.is_manually_corrected = True
    field.corrected_by_id = current_user.id
    db.commit()

    log_audit_event(
        db=db,
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="EXTRACTED_FIELD_CORRECTED",
        entity_type="ExtractedField",
        entity_id=field.id,
        change_summary=f"Corrected '{field.field_name}' from '{old_val}' to '{req.field_value}'. Reason: {req.reason}"
    )

    doc = field.document
    return doc

@router.get("/{id}/download")
def download_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File on disk not found")

    return FileResponse(
        path=doc.file_path,
        filename=doc.file_name,
        media_type=doc.mime_type
    )
