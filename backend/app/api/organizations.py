"""Gestión de organizaciones (tenants SaaS)."""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import is_super_admin
from app.models.organization import Organization
from app.models.user import User

router = APIRouter()


class OrgCreate(BaseModel):
    name: str
    slug: str
    nit: Optional[str] = None
    plan: str = "basic"
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class OrgUpdate(BaseModel):
    name: Optional[str] = None
    nit: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class OrgResponse(BaseModel):
    id: int
    name: str
    slug: str
    nit: Optional[str] = None
    plan: str
    status: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True


def _ensure_super(user: User):
    if not is_super_admin(user):
        raise HTTPException(status_code=403, detail="Solo super_admin")


@router.get("/", response_model=List[OrgResponse])
async def list_orgs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure_super(current_user)
    return db.query(Organization).order_by(Organization.id).all()


@router.post("/", response_model=OrgResponse, status_code=201)
async def create_org(payload: OrgCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure_super(current_user)
    if db.query(Organization).filter(Organization.slug == payload.slug).first():
        raise HTTPException(status_code=400, detail="Slug ya existe")
    org = Organization(**payload.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.put("/{org_id}", response_model=OrgResponse)
async def update_org(org_id: int, payload: OrgUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure_super(current_user)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(org, k, v)
    db.commit()
    db.refresh(org)
    return org


@router.delete("/{org_id}", status_code=204)
async def delete_org(org_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure_super(current_user)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    if org.is_default:
        raise HTTPException(status_code=400, detail="No se puede eliminar la organización por defecto")
    db.delete(org)
    db.commit()
