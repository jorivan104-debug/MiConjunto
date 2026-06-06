"""Cuentas de cobro a residentes (extiende AdministrationInvoice)."""
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class BillingStatus(enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class ChargeType(enum.Enum):
    ADMINISTRATION = "administration"
    EXTRAORDINARY = "extraordinary"
    FINE = "fine"
    UTILITY = "utility"
    INTEREST = "interest"
    PARKING = "parking"
    OTHER = "other"


class PaymentMethod(enum.Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    CARD = "card"
    PSE = "pse"
    OTHER = "other"


class BillingDocument(Base):
    """Cuenta de cobro (factura interna PH) por unidad y período."""
    __tablename__ = "billing_documents"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    document_number = Column(String(30), nullable=True, index=True)
    period_year = Column(Integer, nullable=False)
    period_month = Column(Integer, nullable=False)  # 1-12
    issue_date = Column(DateTime(timezone=True), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    subtotal = Column(Float, default=0.0)
    interest = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    status = Column(Enum(BillingStatus, name="billing_status"), default=BillingStatus.PENDING)
    notes = Column(Text, nullable=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lines = relationship("BillingLine", back_populates="document", cascade="all, delete-orphan")
    payments = relationship("BillingPayment", back_populates="document", cascade="all, delete-orphan")


class BillingLine(Base):
    __tablename__ = "billing_lines"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("billing_documents.id", ondelete="CASCADE"), nullable=False)
    charge_type = Column(Enum(ChargeType, name="charge_type"), nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    coefficient_applied = Column(Float, nullable=True)  # informativo
    chart_account_id = Column(Integer, ForeignKey("chart_of_accounts.id"), nullable=True)

    document = relationship("BillingDocument", back_populates="lines")


class BillingPayment(Base):
    __tablename__ = "billing_payments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("billing_documents.id", ondelete="CASCADE"), nullable=False)
    payment_date = Column(DateTime(timezone=True), nullable=False)
    method = Column(Enum(PaymentMethod, name="billing_payment_method"), default=PaymentMethod.BANK_TRANSFER)
    amount = Column(Float, nullable=False)
    reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("BillingDocument", back_populates="payments")
