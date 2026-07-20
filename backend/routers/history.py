import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from database import get_db
from models import User, ChatSession
from auth import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


class SessionCreate(BaseModel):
    title: Optional[str] = None
    product: Optional[str] = None
    category: Optional[str] = None
    messages: list = Field(default_factory=list)


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    product: Optional[str] = None
    category: Optional[str] = None
    messages: list


class SessionMeta(BaseModel):
    id: int
    title: Optional[str]
    product: Optional[str]
    category: Optional[str]
    message_count: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class SessionFull(SessionMeta):
    messages: list


@router.get("", response_model=List[SessionMeta])
def list_sessions(
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(50)
        .all()
    )
    result = []
    for s in sessions:
        try:
            msgs = json.loads(s.messages or "[]")
        except Exception:
            msgs = []
        result.append(SessionMeta(
            id=s.id,
            title=s.title,
            product=s.product,
            category=s.category,
            message_count=len(msgs),
            created_at=s.created_at,
            updated_at=s.updated_at,
        ))
    return result


@router.post("", status_code=201)
def create_session(
    payload: SessionCreate,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    session = ChatSession(
        user_id=user.id,
        title=payload.title,
        product=payload.product,
        category=payload.category,
        messages=json.dumps(payload.messages),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id}


@router.put("/{session_id}", status_code=200)
def update_session(
    session_id: int,
    payload:    SessionUpdate,
    db:         Session = Depends(get_db),
    user:       User    = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if payload.title is not None:
        session.title = payload.title
    if payload.product is not None:
        session.product = payload.product
    if payload.category is not None:
        session.category = payload.category
    session.messages   = json.dumps(payload.messages)
    session.updated_at = datetime.utcnow()
    db.commit()
    return {"id": session.id}


@router.get("/{session_id}", response_model=SessionFull)
def get_session(
    session_id: int,
    db:         Session = Depends(get_db),
    user:       User    = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        msgs = json.loads(session.messages or "[]")
    except Exception:
        msgs = []
    return SessionFull(
        id=session.id,
        title=session.title,
        product=session.product,
        category=session.category,
        message_count=len(msgs),
        messages=msgs,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db:         Session = Depends(get_db),
    user:       User    = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
