"""Reportes ejecutivos y auditoría."""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import (
    can_access_accounting,
    check_condominium_access,
    is_super_admin,
)
from app.models.audit import AuditLog
from app.models.billing import BillingDocument, BillingStatus
from app.models.inventory import StockLevel, SupplyItem
from app.models.maintenance import WorkOrder, WorkOrderStatus
from app.models.user import User

router = APIRouter()


class AuditEntry(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    description: Optional[str]
    entity_type: Optional[str]
    entity_id: Optional[int]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/condominium/{condominium_id}/dashboard")
async def executive_dashboard(
    condominium_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """KPIs ejecutivos: cartera, mora, OT abiertas, stock crítico."""
    if not check_condominium_access(db, current_user, condominium_id):
        raise HTTPException(status_code=403, detail="Acceso denegado")

    billings = db.query(BillingDocument).filter(BillingDocument.condominium_id == condominium_id).all()
    overdue = [b for b in billings if b.status == BillingStatus.OVERDUE]
    pending = [b for b in billings if b.status in (BillingStatus.PENDING, BillingStatus.PARTIAL)]
    paid_amount = sum(b.paid_amount or 0 for b in billings)
    cartera_total = sum((b.balance or 0) for b in pending + overdue)

    work_orders = db.query(WorkOrder).filter(WorkOrder.condominium_id == condominium_id).all()
    open_wo = [w for w in work_orders if w.status not in (WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED)]

    items = db.query(SupplyItem).filter(SupplyItem.condominium_id == condominium_id).all()
    low_stock = []
    for it in items:
        levels = db.query(StockLevel).filter(StockLevel.supply_item_id == it.id).all()
        total = sum(l.quantity for l in levels)
        if total <= (it.min_stock or 0):
            low_stock.append({"name": it.name, "total": total, "min": it.min_stock})

    return {
        "billings": {
            "total_count": len(billings),
            "paid_amount": paid_amount,
            "cartera_total": cartera_total,
            "overdue_count": len(overdue),
            "pending_count": len(pending),
        },
        "work_orders": {
            "open_count": len(open_wo),
            "completed_count": sum(1 for w in work_orders if w.status == WorkOrderStatus.COMPLETED),
        },
        "inventory": {
            "low_stock_count": len(low_stock),
            "low_stock_items": low_stock[:10],
        },
    }


@router.get("/audit", response_model=List[AuditEntry])
async def audit_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(100, le=500),
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    days: int = Query(30, le=365),
):
    """Audit log — solo super_admin."""
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Solo super_admin")
    q = db.query(AuditLog)
    since = datetime.utcnow() - timedelta(days=days)
    q = q.filter(AuditLog.created_at >= since)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    if action:
        q = q.filter(AuditLog.action == action)
    return q.order_by(AuditLog.created_at.desc()).limit(limit).all()
