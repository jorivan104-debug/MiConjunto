"""Gestión de usuarios (solo admin/super_admin)."""
from datetime import datetime
from pathlib import Path
from typing import List, Optional
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.auth import get_current_user
from app.core.audit import record_audit
from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import can_manage_users, is_super_admin
from app.core.security import get_password_hash
from app.models.condominium import Condominium
from app.models.resident import Resident
from app.models.role import Role
from app.models.user import User, UserCondominium, UserRole
from app.schemas.user import (
    RoleResponse,
    UserCreateAdmin,
    UserDetailResponse,
    UserUpdateAdmin,
)

router = APIRouter()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
USER_UPLOAD_DIR = UPLOAD_DIR / "users"
USER_UPLOAD_DIR.mkdir(exist_ok=True, parents=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ensure_admin(current_user: User) -> None:
    user_role_names = [ur.role.name for ur in current_user.user_roles if ur.role]
    if not (is_super_admin(current_user) or "admin" in user_role_names):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo administradores")


def _serialize(db: Session, user: User) -> dict:
    roles = [
        RoleResponse(id=ur.role.id, name=ur.role.name, description=ur.role.description)
        for ur in user.user_roles
        if ur.role
    ]
    condos = [
        {"id": uc.condominium.id, "name": uc.condominium.name}
        for uc in user.user_condominiums
        if uc.condominium
    ]
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "photo_url": user.photo_url,
        "phone": user.phone,
        "document_type": user.document_type,
        "document_number": user.document_number,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "roles": roles,
        "condominiums": condos,
        "needs_password_change": user.must_change_password,
        "must_change_password": user.must_change_password,
        "totp_enabled": user.totp_enabled,
    }


def _save_user_photo(file: UploadFile, target_user_id: int) -> str:
    file_ext = Path(file.filename or "photo").suffix or ".jpg"
    filename = f"photo_{target_user_id}{file_ext}"
    file_path = USER_UPLOAD_DIR / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return f"/uploads/users/{filename}"


def _sync_residents(db: Session, user: User, role_ids: List[int], condo_ids: List[int]) -> None:
    role_names = set()
    for rid in role_ids:
        r = db.query(Role).filter(Role.id == rid).first()
        if r:
            role_names.add(r.name)
    if not (role_names & {"titular", "residente"}):
        return
    full_name = (user.full_name or user.email or "").strip() or "Sin nombre"
    for cid in condo_ids:
        existing = db.query(Resident).filter(
            Resident.user_id == user.id, Resident.condominium_id == cid
        ).first()
        if not existing:
            db.add(
                Resident(
                    user_id=user.id,
                    condominium_id=cid,
                    full_name=full_name,
                    email=user.email,
                    phone=user.phone,
                    document_type=user.document_type,
                    document_number=user.document_number,
                )
            )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[UserDetailResponse])
async def list_users(
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    role: Optional[str] = None,
    condominium_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    q = db.query(User)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(User.email.ilike(like), User.username.ilike(like), User.full_name.ilike(like)))
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if role:
        q = (
            q.join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .filter(Role.name == role)
        )
    if condominium_id:
        q = q.join(UserCondominium, UserCondominium.user_id == User.id).filter(
            UserCondominium.condominium_id == condominium_id
        )
    users = q.distinct().offset(skip).limit(limit).all()
    return [_serialize(db, u) for u in users]


@router.get("/roles/all", response_model=List[RoleResponse])
async def list_roles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure_admin(current_user)
    return [
        RoleResponse(id=r.id, name=r.name, description=r.description)
        for r in db.query(Role).order_by(Role.id).all()
    ]


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _serialize(db, user)


@router.post("/", response_model=UserDetailResponse, status_code=201)
async def create_user(
    payload: UserCreateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if payload.username and db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username ya registrado")

    hashed = get_password_hash(payload.password) if payload.password else None
    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        document_type=payload.document_type,
        document_number=payload.document_number,
        hashed_password=hashed,
        must_change_password=payload.must_change_password if hashed else True,
        is_active=True,
    )
    db.add(user)
    db.flush()

    for rid in payload.role_ids or []:
        if db.query(Role).filter(Role.id == rid).first():
            db.add(UserRole(user_id=user.id, role_id=rid))
    for cid in payload.condominium_ids or []:
        if db.query(Condominium).filter(Condominium.id == cid).first():
            db.add(UserCondominium(user_id=user.id, condominium_id=cid))

    _sync_residents(db, user, payload.role_ids or [], payload.condominium_ids or [])
    db.commit()
    db.refresh(user)
    record_audit(db, user_id=current_user.id, action="user_created", entity_type="user", entity_id=user.id)
    return _serialize(db, user)


@router.put("/{user_id}", response_model=UserDetailResponse)
async def update_user(
    user_id: int,
    payload: UserUpdateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if payload.email and payload.email != user.email:
        if db.query(User).filter(User.email == payload.email, User.id != user_id).first():
            raise HTTPException(status_code=400, detail="Email ya en uso")
        user.email = payload.email
    if payload.username is not None:
        if payload.username and db.query(User).filter(
            User.username == payload.username, User.id != user_id
        ).first():
            raise HTTPException(status_code=400, detail="Username ya en uso")
        user.username = payload.username

    for field in ["full_name", "phone", "document_type", "document_number"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(user, field, val)
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)
        user.must_change_password = False

    if payload.role_ids is not None:
        db.query(UserRole).filter(UserRole.user_id == user_id).delete()
        for rid in payload.role_ids:
            if db.query(Role).filter(Role.id == rid).first():
                db.add(UserRole(user_id=user_id, role_id=rid))

    if payload.condominium_ids is not None:
        db.query(UserCondominium).filter(UserCondominium.user_id == user_id).delete()
        for cid in payload.condominium_ids:
            if db.query(Condominium).filter(Condominium.id == cid).first():
                db.add(UserCondominium(user_id=user_id, condominium_id=cid))

    effective_roles = payload.role_ids if payload.role_ids is not None else [
        ur.role_id for ur in db.query(UserRole).filter(UserRole.user_id == user_id).all()
    ]
    effective_condos = payload.condominium_ids if payload.condominium_ids is not None else [
        uc.condominium_id for uc in db.query(UserCondominium).filter(UserCondominium.user_id == user_id).all()
    ]
    _sync_residents(db, user, effective_roles, effective_condos)

    db.commit()
    db.refresh(user)
    record_audit(db, user_id=current_user.id, action="user_updated", entity_type="user", entity_id=user.id)
    return _serialize(db, user)


@router.post("/{user_id}/upload-photo", response_model=UserDetailResponse)
async def upload_user_photo(
    user_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.photo_url = _save_user_photo(photo, user_id)
    db.commit()
    db.refresh(user)
    return _serialize(db, user)


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not can_manage_users(current_user):
        raise HTTPException(status_code=403, detail="Solo super_admin puede eliminar usuarios")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    role_names = {ur.role.name for ur in user.user_roles if ur.role}
    residents_linked = db.query(Resident).filter(Resident.user_id == user_id).all()
    if role_names & {"titular", "residente"}:
        for r in residents_linked:
            db.delete(r)
    else:
        db.query(Resident).filter(Resident.user_id == user_id).update({Resident.user_id: None})
    db.delete(user)
    db.commit()
    record_audit(db, user_id=current_user.id, action="user_deleted", entity_type="user", entity_id=user_id)


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Genera contraseña temporal; el usuario debe cambiarla en el primer login."""
    _ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    import secrets, string
    temp = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    user.hashed_password = get_password_hash(temp)
    user.must_change_password = True
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    record_audit(
        db,
        user_id=current_user.id,
        action="user_password_reset",
        entity_type="user",
        entity_id=user.id,
    )
    return {"id": user.id, "temp_password": temp, "must_change_password": True}


@router.patch("/{user_id}/activate", response_model=UserDetailResponse)
async def activate_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = True
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    return _serialize(db, user)


@router.patch("/{user_id}/deactivate", response_model=UserDetailResponse)
async def deactivate_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure_admin(current_user)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return _serialize(db, user)
