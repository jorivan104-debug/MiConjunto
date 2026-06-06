"""Foro comunitario, anuncios, denuncias."""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import check_condominium_access, is_super_admin
from app.models.forum import (
    ComplaintCase,
    ComplaintSeverity,
    ComplaintStatus,
    ForumCategory,
    ForumCategoryType,
    ForumLike,
    ForumPost,
    ForumPostStatus,
    ForumReply,
)
from app.models.user import User

router = APIRouter()


class CategoryIn(BaseModel):
    condominium_id: int
    name: str
    type: ForumCategoryType = ForumCategoryType.GENERAL
    description: Optional[str] = None
    color: Optional[str] = None


class PostIn(BaseModel):
    condominium_id: int
    category_id: Optional[int] = None
    title: str
    body: str
    is_anonymous: bool = False
    severity: Optional[ComplaintSeverity] = None  # solo si es categoría complaint


class PostResponse(BaseModel):
    id: int
    title: str
    body: str
    is_anonymous: bool
    status: ForumPostStatus
    likes_count: int
    replies_count: int
    pinned: bool
    created_at: datetime
    category_id: Optional[int] = None
    author_user_id: Optional[int] = None

    class Config:
        from_attributes = True


class ReplyIn(BaseModel):
    body: str
    parent_reply_id: Optional[int] = None
    is_anonymous: bool = False


def _ensure(user: User, db: Session, condo_id: int):
    if not check_condominium_access(db, user, condo_id):
        raise HTTPException(status_code=403, detail="Sin acceso al condominio")


# ----------------------- Categorías -----------------------


@router.get("/condominium/{condominium_id}/categories")
async def list_categories(condominium_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, condominium_id)
    rows = db.query(ForumCategory).filter(ForumCategory.condominium_id == condominium_id).all()
    return [
        {"id": r.id, "name": r.name, "type": r.type.value, "description": r.description, "color": r.color}
        for r in rows
    ]


@router.post("/categories", status_code=201)
async def create_category(payload: CategoryIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, payload.condominium_id)
    cat = ForumCategory(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "name": cat.name}


# ----------------------- Posts -----------------------


@router.get("/condominium/{condominium_id}/posts", response_model=List[PostResponse])
async def list_posts(
    condominium_id: int,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure(current_user, db, condominium_id)
    q = db.query(ForumPost).filter(ForumPost.condominium_id == condominium_id)
    if category_id:
        q = q.filter(ForumPost.category_id == category_id)
    return q.order_by(ForumPost.pinned.desc(), ForumPost.created_at.desc()).all()


@router.post("/posts", response_model=PostResponse, status_code=201)
async def create_post(payload: PostIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, payload.condominium_id)
    post = ForumPost(
        condominium_id=payload.condominium_id,
        category_id=payload.category_id,
        author_user_id=current_user.id,
        title=payload.title,
        body=payload.body,
        is_anonymous=payload.is_anonymous,
        status=ForumPostStatus.OPEN,
    )
    db.add(post)
    db.flush()

    # Si la categoría es de tipo complaint, abrir caso
    if payload.category_id:
        cat = db.query(ForumCategory).filter(ForumCategory.id == payload.category_id).first()
        if cat and cat.type == ForumCategoryType.COMPLAINT:
            db.add(
                ComplaintCase(
                    post_id=post.id,
                    severity=payload.severity or ComplaintSeverity.MEDIUM,
                    status=ComplaintStatus.OPEN,
                )
            )
    db.commit()
    db.refresh(post)
    return post


@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    _ensure(current_user, db, post.condominium_id)
    return post


@router.get("/posts/{post_id}/replies")
async def list_replies(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    _ensure(current_user, db, post.condominium_id)
    rows = (
        db.query(ForumReply)
        .filter(ForumReply.post_id == post_id)
        .order_by(ForumReply.created_at.asc())
        .all()
    )
    return [
        {
            "id": r.id,
            "body": r.body,
            "is_anonymous": r.is_anonymous,
            "author_user_id": r.author_user_id if not r.is_anonymous else None,
            "parent_reply_id": r.parent_reply_id,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.post("/posts/{post_id}/replies", status_code=201)
async def create_reply(post_id: int, payload: ReplyIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    _ensure(current_user, db, post.condominium_id)
    reply = ForumReply(
        post_id=post_id,
        parent_reply_id=payload.parent_reply_id,
        author_user_id=current_user.id,
        body=payload.body,
        is_anonymous=payload.is_anonymous,
    )
    db.add(reply)
    post.replies_count = (post.replies_count or 0) + 1
    db.commit()
    db.refresh(reply)
    return {"id": reply.id, "post_id": post_id}


@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    _ensure(current_user, db, post.condominium_id)
    existing = (
        db.query(ForumLike)
        .filter(ForumLike.post_id == post_id, ForumLike.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        post.likes_count = max(0, (post.likes_count or 0) - 1)
        db.commit()
        return {"liked": False, "likes_count": post.likes_count}
    db.add(ForumLike(post_id=post_id, user_id=current_user.id))
    post.likes_count = (post.likes_count or 0) + 1
    db.commit()
    return {"liked": True, "likes_count": post.likes_count}


# ----------------------- Denuncias -----------------------


@router.get("/condominium/{condominium_id}/complaints")
async def list_complaints(condominium_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, condominium_id)
    cases = (
        db.query(ComplaintCase, ForumPost)
        .join(ForumPost, ForumPost.id == ComplaintCase.post_id)
        .filter(ForumPost.condominium_id == condominium_id)
        .order_by(ComplaintCase.created_at.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "post_id": c.post_id,
            "title": p.title,
            "severity": c.severity.value,
            "status": c.status.value,
            "is_anonymous": p.is_anonymous,
            "assigned_to": c.assigned_to,
            "created_at": c.created_at,
            "resolved_at": c.resolved_at,
        }
        for c, p in cases
    ]


@router.patch("/complaints/{case_id}")
async def update_complaint(
    case_id: int,
    status: Optional[ComplaintStatus] = None,
    severity: Optional[ComplaintSeverity] = None,
    assigned_to: Optional[int] = None,
    resolution: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = db.query(ComplaintCase).filter(ComplaintCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    post = db.query(ForumPost).filter(ForumPost.id == case.post_id).first()
    _ensure(current_user, db, post.condominium_id)
    if status:
        case.status = status
        if status == ComplaintStatus.RESOLVED:
            case.resolved_at = datetime.utcnow()
        if status == ComplaintStatus.CLOSED:
            case.closed_at = datetime.utcnow()
    if severity:
        case.severity = severity
    if assigned_to is not None:
        case.assigned_to = assigned_to
    if resolution is not None:
        case.resolution = resolution
    db.commit()
    return {"ok": True}
