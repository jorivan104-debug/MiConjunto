"""Inventario y bodegas — kardex, movimientos, alertas."""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import check_condominium_access
from app.models.inventory import (
    StockLevel,
    StockMovement,
    StockMovementType,
    SupplyItem,
    Supplier,
    Warehouse,
)
from app.models.user import User

router = APIRouter()


class WarehouseIn(BaseModel):
    condominium_id: int
    name: str
    code: Optional[str] = None
    location: Optional[str] = None
    responsible_user_id: Optional[int] = None


class WarehouseResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    location: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class SupplyItemIn(BaseModel):
    condominium_id: int
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit: str = "unidad"
    min_stock: float = 0.0


class SupplyItemResponse(BaseModel):
    id: int
    sku: Optional[str] = None
    name: str
    category: Optional[str] = None
    unit: str
    min_stock: float
    is_active: bool

    class Config:
        from_attributes = True


class StockMovementIn(BaseModel):
    warehouse_id: int
    supply_item_id: int
    type: StockMovementType
    quantity: float
    unit_cost: float = 0.0
    related_warehouse_id: Optional[int] = None
    supplier_id: Optional[int] = None
    notes: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None


class StockMovementResponse(BaseModel):
    id: int
    warehouse_id: int
    supply_item_id: int
    type: StockMovementType
    quantity: float
    unit_cost: float
    total_cost: float
    created_at: datetime

    class Config:
        from_attributes = True


def _ensure(user: User, db: Session, condo_id: int):
    if not check_condominium_access(db, user, condo_id):
        raise HTTPException(status_code=403, detail="Sin acceso al condominio")


# ----------------------------- Warehouses -----------------------------


@router.get("/condominium/{condominium_id}/warehouses", response_model=List[WarehouseResponse])
async def list_warehouses(condominium_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, condominium_id)
    return db.query(Warehouse).filter(Warehouse.condominium_id == condominium_id).all()


@router.post("/warehouses", response_model=WarehouseResponse, status_code=201)
async def create_warehouse(payload: WarehouseIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, payload.condominium_id)
    wh = Warehouse(**payload.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


# ----------------------------- Items -----------------------------


@router.get("/condominium/{condominium_id}/items", response_model=List[SupplyItemResponse])
async def list_items(condominium_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, condominium_id)
    return db.query(SupplyItem).filter(SupplyItem.condominium_id == condominium_id).all()


@router.post("/items", response_model=SupplyItemResponse, status_code=201)
async def create_item(payload: SupplyItemIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, payload.condominium_id)
    item = SupplyItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ----------------------------- Stock levels (kardex) -----------------------------


@router.get("/warehouse/{warehouse_id}/stock")
async def warehouse_stock(warehouse_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    _ensure(current_user, db, wh.condominium_id)
    levels = db.query(StockLevel).filter(StockLevel.warehouse_id == warehouse_id).all()
    out = []
    for lvl in levels:
        item = db.query(SupplyItem).filter(SupplyItem.id == lvl.supply_item_id).first()
        if not item:
            continue
        out.append(
            {
                "supply_item_id": item.id,
                "name": item.name,
                "sku": item.sku,
                "unit": item.unit,
                "quantity": lvl.quantity,
                "avg_unit_cost": lvl.avg_unit_cost,
                "min_stock": item.min_stock,
                "low_stock": lvl.quantity <= (item.min_stock or 0),
            }
        )
    return out


@router.get("/condominium/{condominium_id}/low-stock")
async def low_stock_items(condominium_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, condominium_id)
    items = db.query(SupplyItem).filter(SupplyItem.condominium_id == condominium_id).all()
    alerts = []
    for it in items:
        levels = db.query(StockLevel).filter(StockLevel.supply_item_id == it.id).all()
        total = sum(lvl.quantity for lvl in levels)
        if total <= (it.min_stock or 0):
            alerts.append(
                {
                    "supply_item_id": it.id,
                    "name": it.name,
                    "sku": it.sku,
                    "total_stock": total,
                    "min_stock": it.min_stock,
                }
            )
    return alerts


# ----------------------------- Movimientos -----------------------------


def _apply_movement(db: Session, mov: StockMovement, *, into_warehouse_id: Optional[int] = None) -> None:
    target_wh = into_warehouse_id or mov.warehouse_id
    level = (
        db.query(StockLevel)
        .filter(StockLevel.warehouse_id == target_wh, StockLevel.supply_item_id == mov.supply_item_id)
        .first()
    )
    if not level:
        level = StockLevel(warehouse_id=target_wh, supply_item_id=mov.supply_item_id, quantity=0, avg_unit_cost=0)
        db.add(level)
        db.flush()

    if mov.type == StockMovementType.IN:
        old_qty = level.quantity
        old_cost = level.avg_unit_cost
        new_qty = old_qty + mov.quantity
        if new_qty > 0:
            # promedio ponderado
            level.avg_unit_cost = ((old_qty * old_cost) + (mov.quantity * mov.unit_cost)) / new_qty
        level.quantity = new_qty
    elif mov.type == StockMovementType.OUT:
        if level.quantity < mov.quantity:
            raise HTTPException(status_code=400, detail="Stock insuficiente")
        level.quantity -= mov.quantity
    elif mov.type == StockMovementType.ADJUST:
        level.quantity = mov.quantity  # ajuste directo
    elif mov.type == StockMovementType.TRANSFER:
        # outbound: descontar de origen
        if into_warehouse_id is None:
            if level.quantity < mov.quantity:
                raise HTTPException(status_code=400, detail="Stock insuficiente para transferir")
            level.quantity -= mov.quantity
        else:
            # inbound: aumentar en destino
            level.quantity += mov.quantity


@router.post("/movements", response_model=StockMovementResponse, status_code=201)
async def create_movement(
    payload: StockMovementIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wh = db.query(Warehouse).filter(Warehouse.id == payload.warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")
    _ensure(current_user, db, wh.condominium_id)

    mov = StockMovement(
        warehouse_id=payload.warehouse_id,
        supply_item_id=payload.supply_item_id,
        type=payload.type,
        quantity=payload.quantity,
        unit_cost=payload.unit_cost,
        total_cost=payload.unit_cost * payload.quantity,
        related_warehouse_id=payload.related_warehouse_id,
        supplier_id=payload.supplier_id,
        notes=payload.notes,
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        created_by=current_user.id,
    )
    db.add(mov)
    db.flush()

    _apply_movement(db, mov)
    if mov.type == StockMovementType.TRANSFER and mov.related_warehouse_id:
        _apply_movement(db, mov, into_warehouse_id=mov.related_warehouse_id)

    db.commit()
    db.refresh(mov)
    return mov


@router.get("/condominium/{condominium_id}/movements", response_model=List[StockMovementResponse])
async def list_movements(
    condominium_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 100,
):
    _ensure(current_user, db, condominium_id)
    return (
        db.query(StockMovement)
        .join(Warehouse, Warehouse.id == StockMovement.warehouse_id)
        .filter(Warehouse.condominium_id == condominium_id)
        .order_by(StockMovement.created_at.desc())
        .limit(limit)
        .all()
    )


# ----------------------------- Suppliers -----------------------------


class SupplierIn(BaseModel):
    condominium_id: int
    name: str
    nit: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


@router.get("/condominium/{condominium_id}/suppliers")
async def list_suppliers(condominium_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, condominium_id)
    rows = db.query(Supplier).filter(Supplier.condominium_id == condominium_id).all()
    return [{"id": r.id, "name": r.name, "nit": r.nit, "phone": r.phone, "email": r.email} for r in rows]


@router.post("/suppliers", status_code=201)
async def create_supplier(payload: SupplierIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _ensure(current_user, db, payload.condominium_id)
    sup = Supplier(**payload.model_dump())
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return {"id": sup.id, "name": sup.name, "nit": sup.nit}
