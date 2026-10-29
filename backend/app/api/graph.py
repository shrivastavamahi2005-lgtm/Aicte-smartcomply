from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import ComplianceGraphResponse
from app.services.auth_service import get_current_user
from app.services.graph_service import build_application_compliance_graph
from app.models.entities import User

router = APIRouter(prefix="/graph", tags=["Compliance Graph"])

@router.get("/applications/{id}", response_model=ComplianceGraphResponse)
def get_application_graph(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    graph_data = build_application_compliance_graph(db, id)
    return graph_data
