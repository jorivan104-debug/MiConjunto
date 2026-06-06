"""Esquema contable PUC (doble partida) para Mi Conjunto.

Reemplaza progresivamente el subledger simple en `accounting.py`. El modelo legacy
permanece para lectura durante la transición.
"""
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class AccountType(enum.Enum):
    ACTIVO = "activo"
    PASIVO = "pasivo"
    PATRIMONIO = "patrimonio"
    INGRESO = "ingreso"
    GASTO = "gasto"
    COSTO = "costo"
    ORDEN = "orden"


class JournalStatus(enum.Enum):
    DRAFT = "draft"
    POSTED = "posted"
    REVERSED = "reversed"


class ChartOfAccount(Base):
    """Plan único de cuentas (PUC) jerárquico por condominio."""
    __tablename__ = "chart_of_accounts"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("chart_of_accounts.id"), nullable=True)
    code = Column(String(20), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(AccountType, name="account_type"), nullable=False)
    level = Column(Integer, default=1)  # 1=clase, 2=grupo, 3=cuenta, 4=subcuenta, 5=auxiliar
    accepts_movement = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parent = relationship("ChartOfAccount", remote_side=[id])
    journal_lines = relationship("JournalLine", back_populates="account")


class ThirdParty(Base):
    """Terceros (residentes, proveedores, empleados) para auxiliares contables."""
    __tablename__ = "third_parties"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # resident, supplier, employee, other
    document_type = Column(String(20), nullable=True)  # CC, NIT, CE, etc.
    document_number = Column(String(50), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    # Vínculos opcionales
    resident_id = Column(Integer, ForeignKey("residents.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BankAccount(Base):
    """Cuentas bancarias del condominio."""
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    chart_account_id = Column(Integer, ForeignKey("chart_of_accounts.id"), nullable=True)
    bank_name = Column(String(255), nullable=False)
    account_number = Column(String(50), nullable=False)
    account_type = Column(String(20), default="ahorros")  # ahorros, corriente
    currency = Column(String(10), default="COP")
    opening_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class JournalEntry(Base):
    """Asiento contable. Cabecera con líneas que cuadran (debe = haber)."""
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    entry_number = Column(String(20), nullable=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=True)
    source_module = Column(String(50), nullable=True)  # billing, inventory, maintenance, manual
    source_id = Column(Integer, nullable=True)
    status = Column(Enum(JournalStatus, name="journal_status"), default=JournalStatus.DRAFT)
    total_debit = Column(Float, default=0.0)
    total_credit = Column(Float, default=0.0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lines = relationship("JournalLine", back_populates="entry", cascade="all, delete-orphan")


class JournalLine(Base):
    """Línea contable individual (debe o haber)."""
    __tablename__ = "journal_lines"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(Integer, ForeignKey("chart_of_accounts.id"), nullable=False)
    third_party_id = Column(Integer, ForeignKey("third_parties.id"), nullable=True)
    cost_center = Column(String(50), nullable=True)
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    reference = Column(String(100), nullable=True)

    entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("ChartOfAccount", back_populates="journal_lines")


class BankStatementLine(Base):
    """Movimientos del extracto bancario para conciliación."""
    __tablename__ = "bank_statement_lines"

    id = Column(Integer, primary_key=True, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)  # signed (+ ingreso, - egreso)
    reference = Column(String(100), nullable=True)
    matched_journal_line_id = Column(Integer, ForeignKey("journal_lines.id"), nullable=True)
    is_reconciled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
