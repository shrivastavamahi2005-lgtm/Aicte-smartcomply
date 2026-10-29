from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User, ChatbotConversation, ChatbotMessage
from app.schemas.schemas import ChatQueryRequest, ChatMessageResponse
from app.services.auth_service import get_current_user
from app.services.copilot_service import answer_compliance_query

router = APIRouter(prefix="/copilot", tags=["AI Compliance Copilot"])

@router.post("/query", response_model=ChatMessageResponse)
def query_copilot(
    req: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = answer_compliance_query(
        db=db,
        user=current_user,
        query_text=req.message,
        application_id=req.application_id,
        conversation_id=req.conversation_id
    )
    return ChatMessageResponse(
        id=result["id"],
        conversation_id=result["conversation_id"],
        sender_role=result["sender_role"],
        content=result["content"],
        citations=result.get("citations"),
        is_fallback=result.get("is_fallback", False),
        created_at=result["created_at"]
    )

@router.get("/history/{conversation_id}")
def get_history(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(ChatbotMessage).filter(
        ChatbotMessage.conversation_id == conversation_id
    ).order_by(ChatbotMessage.created_at.asc()).all()

    return [
        {
            "id": m.id,
            "sender_role": m.sender_role,
            "content": m.content,
            "citations": m.citations_json,
            "is_fallback": m.is_fallback,
            "created_at": m.created_at
        }
        for m in messages
    ]
