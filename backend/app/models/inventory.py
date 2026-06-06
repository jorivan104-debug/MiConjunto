"""Inventario y bodegas."""
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class StockMovementType(enum.Enum):
    IN = "in"            # entrada (compra, ajuste positivo)
    OUT = "out"          # salida (consumo, baja, ajuste negativo)
    TRANSFER = "transfer"  # entre bodegas
    ADJUST = "adjust"    # ajuste manual


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(30), nullable=True)
    location = Column(String(255), nullable=True)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stock_levels = relationship("StockLevel", back_populates="warehouse", cascade="all, delete-orphan")
    movements = relationship(
        "StockMovement",
        back_populates="warehouse",
        cascade="all, delete-orphan",
        foreign_keys="StockMovement.warehouse_id",
    )


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    nit = Column(String(50), nullable=True, index=True)
    contact_name = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SupplyItem(Base):
    """Catálogo de insumos."""
    __tablename__ = "supply_items"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    sku = Column(String(50), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(80), nullable=True)
    unit = Column(String(20), default="unidad")  # unidad, kg, litro, etc.
    min_stock = Column(Float, default=0.0)
    max_stock = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    stock_levels = relationship("StockLevel", back_populates="item", cascade="all, delete-orphan")


class StockLevel(Base):
    """Saldo actual por bodega/insumo."""
    __tablename__ = "stock_levels"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    supply_item_id = Column(Integer, ForeignKey("supply_items.id"), nullable=False, index=True)
    quantity = Column(Float, default=0.0)
    avg_unit_cost = Column(Float, default=0.0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    warehouse = relationship("Warehouse", back_populates="stock_levels")
    item = relationship("SupplyItem", back_populates="stock_levels")


class StockMovement(Base):
    """Auditoría de movimientos (kardex)."""
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    supply_item_id = Column(Integer, ForeignKey("supply_items.id"), nullable=False, index=True)
    type = Column(Enum(StockMovementType, name="stock_movement_type"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    # Referencia a origen: orden de trabajo, compra, etc.
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(Integer, nullable=True)
    # Para transferencias
    related_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    warehouse = relationship("Warehouse", back_populates="movements", foreign_keys=[warehouse_id])
