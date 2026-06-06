"""Mantenimiento — activos y órdenes de trabajo."""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import check_condominium_access
from app.models.inventory import StockLevel, StockMovement, StockMovementType, SupplyItem, Warehouse
from app.models.maintenance import (
    MaintenanceAsset,
    WorkOrder,
    WorkOrderMaterial,
    WorkOrderPriority,
    WorkOrderStatus,
    WorkOrderTask,
    WorkOrderType,
)
from app.models.user import User

router = APIRouter()


class AssetIn(BaseModel):
    condominium_id: int
    name: str
    asset_type: Optional[str] = None
    location: Optional[str] = None
    serial_number: Optional[str] = None
    notes: Optional[str] = None


class AssetResponse(BaseModel):
    id: int
    name: str
    asset_type: Optional[str] = None
    location: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class TaskIn(BaseModel):
    description: str
    order_index: int = 0


class WorkOrderIn(BaseModel):
    condominium_id: int
    asset_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    type: WorkOrderType = WorkOrderType.CORRECTIVE
    priority: WorkOrderPriority = WorkOrderPriority.MEDIUM
    scheduled_at: Optional[datetime] = None
    assigned_to: Optional[int] = None
    supplier_id: Optional[int] = None
    estimated_cost: float = 0.0
    tasks: List[TaskIn] = []


class WorkOrderResponse(BaseModel):
    id: int
    code: Optional[str] = None
    title: str
    type: WorkOrderType
    priority: WorkOrderPriority
    status: WorkOrderStatus
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_cost: float
    actual_cost: float

    class Config:
        from_attributes = True


class MaterialConsumptionIn(BaseModel):
    supply_item_id: int
    warehouse_id: int
    quantity: float
    unit_cost: Optional[float] = None  # si no se da, usa avg de bodega


def _ensure(user: User, db: Session, condo_id: int):
    if not check_condominium_access(db, user, condo_id):
        raise HTTPException(status_code=403, detail="Sin acceso al condominio")


def _next_code(db: Session, condo_id: int) -> str:
    last = (
        db.query(WorkOrder)
        .filter(WorkOrder.condominium_id == condo_id)
        .order_by(WorkOrder.id.desc())
        .first()
    )
    n = (last.id + 1) if last else 1
    return f"OT-{datetime.utcnow().year}-{n:05d}"


# ------------------------- Assets -------------------------


@router.get("/condominium/{condominium_id}/assets", response_model=List[AssetResponse])
async def list_assets(condominium_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, condominium_id)
    return db.query(MaintenanceAsset).filter(MaintenanceAsset.condominium_id == condominium_id).all()


@router.post("/assets", response_model=AssetResponse, status_code=201)
async def create_asset(payload: AssetIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, payload.condominium_id)
    asset = MaintenanceAsset(**payload.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


# ------------------------- Work Orders -------------------------


@router.get("/condominium/{condominium_id}/work-orders", response_model=List[WorkOrderResponse])
async def list_work_orders(
    condominium_id: int,
    status: Optional[WorkOrderStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure(current_user, db, condominium_id)
    q = db.query(WorkOrder).filter(WorkOrder.condominium_id == condominium_id)
    if status:
        q = q.filter(WorkOrder.status == status)
    return q.order_by(WorkOrder.created_at.desc()).all()


@router.post("/work-orders", response_model=WorkOrderResponse, status_code=201)
async def create_work_order(payload: WorkOrderIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, payload.condominium_id)
    wo = WorkOrder(
        condominium_id=payload.condominium_id,
        code=_next_code(db, payload.condominium_id),
        asset_id=payload.asset_id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        priority=payload.priority,
        scheduled_at=payload.scheduled_at,
        assigned_to=payload.assigned_to,
        supplier_id=payload.supplier_id,
        estimated_cost=payload.estimated_cost,
        created_by=current_user.id,
    )
    db.add(wo)
    db.flush()
    for i, t in enumerate(payload.tasks):
        db.add(WorkOrderTask(work_order_id=wo.id, description=t.description, order_index=t.order_index or i))
    db.commit()
    db.refresh(wo)
    return wo


@router.post("/work-orders/{wo_id}/start", response_model=WorkOrderResponse)
async def start_work_order(wo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="OT no encontrada")
    _ensure(current_user, db, wo.condominium_id)
    wo.status = WorkOrderStatus.IN_PROGRESS
    wo.started_at = datetime.utcnow()
    db.commit()
    db.refresh(wo)
    return wo


@router.post("/work-orders/{wo_id}/complete", response_model=WorkOrderResponse)
async def complete_work_order(wo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="OT no encontrada")
    _ensure(current_user, db, wo.condominium_id)
    wo.status = WorkOrderStatus.COMPLETED
    wo.completed_at = datetime.utcnow()
    # actual_cost = sum tasks' materials
    total_mat = sum((m.total_cost or 0) for m in wo.materials)
    wo.actual_cost = total_mat
    db.commit()
    db.refresh(wo)
    return wo


@router.post("/work-orders/{wo_id}/consume-material")
async def consume_material(
    wo_id: int,
    payload: MaterialConsumptionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="OT no encontrada")
    _ensure(current_user, db, wo.condominium_id)

    wh = db.query(Warehouse).filter(Warehouse.id == payload.warehouse_id).first()
    if not wh or wh.condominium_id != wo.condominium_id:
        raise HTTPException(status_code=400, detail="Bodega inválida")
    item = db.query(SupplyItem).filter(SupplyItem.id == payload.supply_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

    level = (
        db.query(StockLevel)
        .filter(StockLevel.warehouse_id == wh.id, StockLevel.supply_item_id == item.id)
        .first()
    )
    if not level or level.quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    unit_cost = payload.unit_cost if payload.unit_cost is not None else (level.avg_unit_cost or 0)
    total_cost = unit_cost * payload.quantity

    mov = StockMovement(
        warehouse_id=wh.id,
        supply_item_id=item.id,
        type=StockMovementType.OUT,
        quantity=payload.quantity,
        unit_cost=unit_cost,
        total_cost=total_cost,
        reference_type="work_order",
        reference_id=wo.id,
        notes=f"Consumo OT {wo.code}",
        created_by=current_user.id,
    )
    db.add(mov)
    db.flush()
    level.quantity -= payload.quantity

    db.add(
        WorkOrderMaterial(
            work_order_id=wo.id,
            supply_item_id=item.id,
            quantity=payload.quantity,
            unit_cost=unit_cost,
            total_cost=total_cost,
            stock_movement_id=mov.id,
        )
    )
    db.commit()
    return {"ok": True, "movement_id": mov.id, "total_cost": total_cost}
