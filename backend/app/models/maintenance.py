"""Mantenimiento y órdenes de trabajo."""
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class WorkOrderStatus(enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WorkOrderType(enum.Enum):
    CORRECTIVE = "corrective"
    PREVENTIVE = "preventive"
    EMERGENCY = "emergency"


class WorkOrderPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class MaintenanceAsset(Base):
    """Activo o área a mantener (ascensor, planta eléctrica, piscina, etc.)."""
    __tablename__ = "maintenance_assets"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(80), nullable=True)  # ascensor, planta, bomba, jardin
    location = Column(String(255), nullable=True)
    serial_number = Column(String(100), nullable=True)
    installation_date = Column(DateTime(timezone=True), nullable=True)
    warranty_until = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work_orders = relationship("WorkOrder", back_populates="asset")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    code = Column(String(30), nullable=True, index=True)
    asset_id = Column(Integer, ForeignKey("maintenance_assets.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(WorkOrderType, name="work_order_type"), default=WorkOrderType.CORRECTIVE)
    priority = Column(Enum(WorkOrderPriority, name="work_order_priority"), default=WorkOrderPriority.MEDIUM)
    status = Column(Enum(WorkOrderStatus, name="work_order_status"), default=WorkOrderStatus.OPEN)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    estimated_cost = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    asset = relationship("MaintenanceAsset", back_populates="work_orders")
    tasks = relationship("WorkOrderTask", back_populates="work_order", cascade="all, delete-orphan")
    materials = relationship("WorkOrderMaterial", back_populates="work_order", cascade="all, delete-orphan")


class WorkOrderTask(Base):
    __tablename__ = "work_order_tasks"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(500), nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    order_index = Column(Integer, default=0)

    work_order = relationship("WorkOrder", back_populates="tasks")


class WorkOrderMaterial(Base):
    """Insumos consumidos en la OT — vinculados a stock_movement."""
    __tablename__ = "work_order_materials"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False)
    supply_item_id = Column(Integer, ForeignKey("supply_items.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    stock_movement_id = Column(Integer, ForeignKey("stock_movements.id"), nullable=True)
    notes = Column(Text, nullable=True)

    work_order = relationship("WorkOrder", back_populates="materials")
