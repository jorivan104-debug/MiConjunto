"""Cuentas de cobro (billing) — extiende AdministrationInvoice con líneas."""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import (
    can_access_accounting,
    check_condominium_access,
)
from app.models.billing import (
    BillingDocument,
    BillingLine,
    BillingPayment,
    BillingStatus,
    ChargeType,
    PaymentMethod,
)
from app.models.condominium import Condominium
from app.models.property import Property
from app.models.user import User
from app.services.journal import post_simple_entry
from app.models.accounting_puc import ChartOfAccount

router = APIRouter()


class BillingLineIn(BaseModel):
    charge_type: ChargeType = ChargeType.ADMINISTRATION
    description: str
    amount: float


class BillingDocumentCreate(BaseModel):
    condominium_id: int
    property_id: int
    period_year: int
    period_month: int
    issue_date: datetime
    due_date: datetime
    notes: Optional[str] = None
    lines: List[BillingLineIn]


class BillingPaymentIn(BaseModel):
    amount: float
    method: PaymentMethod = PaymentMethod.BANK_TRANSFER
    payment_date: datetime
    reference: Optional[str] = None
    notes: Optional[str] = None
    bank_account_id: Optional[int] = None


class BillingDocumentResponse(BaseModel):
    id: int
    document_number: Optional[str] = None
    period_year: int
    period_month: int
    issue_date: datetime
    due_date: datetime
    subtotal: float
    interest: float
    total: float
    paid_amount: float
    balance: float
    status: BillingStatus
    property_id: int

    class Config:
        from_attributes = True


def _ensure(user: User, db: Session, condo_id: int):
    if not check_condominium_access(db, user, condo_id):
        raise HTTPException(status_code=403, detail="Sin acceso al condominio")


def _document_number(db: Session, condo_id: int, year: int) -> str:
    last = (
        db.query(BillingDocument)
        .filter(
            BillingDocument.condominium_id == condo_id,
            BillingDocument.period_year == year,
        )
        .count()
    )
    return f"CC-{year}-{last + 1:05d}"


def _account_id(db: Session, condo_id: int, code: str) -> Optional[int]:
    a = (
        db.query(ChartOfAccount)
        .filter(ChartOfAccount.condominium_id == condo_id, ChartOfAccount.code == code)
        .first()
    )
    return a.id if a else None


@router.post("/", response_model=BillingDocumentResponse, status_code=201)
async def create_billing(
    payload: BillingDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure(current_user, db, payload.condominium_id)
    if not payload.lines:
        raise HTTPException(status_code=400, detail="Cuenta de cobro requiere líneas")
    subtotal = sum(l.amount for l in payload.lines)
    doc = BillingDocument(
        condominium_id=payload.condominium_id,
        property_id=payload.property_id,
        document_number=_document_number(db, payload.condominium_id, payload.period_year),
        period_year=payload.period_year,
        period_month=payload.period_month,
        issue_date=payload.issue_date,
        due_date=payload.due_date,
        subtotal=subtotal,
        total=subtotal,
        balance=subtotal,
        notes=payload.notes,
        status=BillingStatus.PENDING,
        created_by=current_user.id,
    )
    db.add(doc)
    db.flush()
    for line in payload.lines:
        db.add(
            BillingLine(
                document_id=doc.id,
                charge_type=line.charge_type,
                description=line.description,
                amount=line.amount,
            )
        )

    # Asiento contable: Débito Cartera / Crédito Ingresos
    cart_id = _account_id(db, payload.condominium_id, "1305")
    ing_id = _account_id(db, payload.condominium_id, "4105")
    if cart_id and ing_id and can_access_accounting(current_user):
        entry = post_simple_entry(
            db,
            condominium_id=payload.condominium_id,
            date=payload.issue_date,
            description=f"Cuenta de cobro {doc.document_number}",
            source_module="billing",
            source_id=doc.id,
            debit_account_id=cart_id,
            credit_account_id=ing_id,
            amount=subtotal,
            user_id=current_user.id,
        )
        db.flush()
        doc.journal_entry_id = entry.id

    db.commit()
    db.refresh(doc)
    return doc


@router.get("/condominium/{condominium_id}", response_model=List[BillingDocumentResponse])
async def list_billings(
    condominium_id: int,
    status: Optional[BillingStatus] = None,
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure(current_user, db, condominium_id)
    q = db.query(BillingDocument).filter(BillingDocument.condominium_id == condominium_id)
    if status:
        q = q.filter(BillingDocument.status == status)
    if property_id:
        q = q.filter(BillingDocument.property_id == property_id)
    return q.order_by(BillingDocument.issue_date.desc()).limit(500).all()


@router.get("/{billing_id}", response_model=BillingDocumentResponse)
async def get_billing(billing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(BillingDocument).filter(BillingDocument.id == billing_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="No encontrado")
    _ensure(current_user, db, doc.condominium_id)
    return doc


@router.post("/{billing_id}/payments", response_model=BillingDocumentResponse)
async def register_payment(
    billing_id: int,
    payload: BillingPaymentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(BillingDocument).filter(BillingDocument.id == billing_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="No encontrado")
    _ensure(current_user, db, doc.condominium_id)
    if doc.status == BillingStatus.PAID:
        raise HTTPException(status_code=400, detail="Documento ya pagado")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Monto inválido")

    # Asiento Débito Bancos (o Caja) / Crédito Cartera
    bank_id = _account_id(db, doc.condominium_id, "1110")
    cart_id = _account_id(db, doc.condominium_id, "1305")
    journal_entry_id: Optional[int] = None
    if bank_id and cart_id and can_access_accounting(current_user):
        entry = post_simple_entry(
            db,
            condominium_id=doc.condominium_id,
            date=payload.payment_date,
            description=f"Pago cuenta {doc.document_number}",
            source_module="billing_payment",
            source_id=doc.id,
            debit_account_id=bank_id,
            credit_account_id=cart_id,
            amount=payload.amount,
            user_id=current_user.id,
        )
        db.flush()
        journal_entry_id = entry.id

    payment = BillingPayment(
        document_id=doc.id,
        amount=payload.amount,
        method=payload.method,
        payment_date=payload.payment_date,
        reference=payload.reference,
        notes=payload.notes,
        bank_account_id=payload.bank_account_id,
        journal_entry_id=journal_entry_id,
        created_by=current_user.id,
    )
    db.add(payment)

    doc.paid_amount = (doc.paid_amount or 0) + payload.amount
    doc.balance = max(0, doc.total - doc.paid_amount)
    if doc.balance == 0:
        doc.status = BillingStatus.PAID
    elif doc.paid_amount > 0:
        doc.status = BillingStatus.PARTIAL

    db.commit()
    db.refresh(doc)
    return doc


@router.post("/condominium/{condominium_id}/generate-monthly", response_model=List[BillingDocumentResponse])
async def generate_monthly(
    condominium_id: int,
    period_year: int,
    period_month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Genera cuentas de cobro para todas las propiedades del condominio."""
    _ensure(current_user, db, condominium_id)
    condo = db.query(Condominium).filter(Condominium.id == condominium_id).first()
    if not condo:
        raise HTTPException(status_code=404, detail="Condominio no encontrado")

    properties = db.query(Property).filter(Property.condominium_id == condominium_id).all()
    if not properties:
        raise HTTPException(status_code=400, detail="Sin propiedades configuradas")

    issue_date = datetime(period_year, period_month, 1)
    due_date = issue_date + timedelta(days=15)
    is_global = (condo.administration_value_type or "global") == "global"
    base_amount = condo.administration_value_cop or 0

    docs = []
    for prop in properties:
        amount = base_amount if is_global else (prop.administration_fee_cop or 0)
        if amount <= 0:
            continue
        # Evitar duplicados
        existing = (
            db.query(BillingDocument)
            .filter(
                BillingDocument.property_id == prop.id,
                BillingDocument.period_year == period_year,
                BillingDocument.period_month == period_month,
            )
            .first()
        )
        if existing:
            docs.append(existing)
            continue
        doc = BillingDocument(
            condominium_id=condominium_id,
            property_id=prop.id,
            document_number=_document_number(db, condominium_id, period_year),
            period_year=period_year,
            period_month=period_month,
            issue_date=issue_date,
            due_date=due_date,
            subtotal=amount,
            total=amount,
            balance=amount,
            status=BillingStatus.PENDING,
            created_by=current_user.id,
        )
        db.add(doc)
        db.flush()
        db.add(
            BillingLine(
                document_id=doc.id,
                charge_type=ChargeType.ADMINISTRATION,
                description=f"Cuota de administración {period_month:02d}/{period_year}",
                amount=amount,
                coefficient_applied=prop.coefficient,
            )
        )
        docs.append(doc)
    db.commit()
    for d in docs:
        db.refresh(d)
    return docs
