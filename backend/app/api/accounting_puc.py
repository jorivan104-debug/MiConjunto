"""API de contabilidad PUC: plan de cuentas, asientos, cuentas bancarias y reportes."""
from datetime import datetime
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
from app.models.accounting_puc import (
    AccountType,
    BankAccount,
    ChartOfAccount,
    JournalEntry,
    JournalLine,
    JournalStatus,
    ThirdParty,
)
from app.models.user import User
from app.services.puc_seed import seed_puc_for_condominium
from app.services.journal import build_entry_number, totals_match

router = APIRouter()


# ---------------------------- Schemas -----------------------------


class AccountCreate(BaseModel):
    code: str
    name: str
    type: AccountType
    parent_id: Optional[int] = None
    level: int = 1
    accepts_movement: bool = True
    description: Optional[str] = None


class AccountResponse(BaseModel):
    id: int
    code: str
    name: str
    type: AccountType
    parent_id: Optional[int] = None
    level: int
    accepts_movement: bool

    class Config:
        from_attributes = True


class JournalLineIn(BaseModel):
    account_id: int
    debit: float = 0.0
    credit: float = 0.0
    third_party_id: Optional[int] = None
    cost_center: Optional[str] = None
    description: Optional[str] = None
    reference: Optional[str] = None


class JournalEntryCreate(BaseModel):
    condominium_id: int
    date: datetime
    description: Optional[str] = None
    source_module: Optional[str] = None
    lines: List[JournalLineIn]


class JournalEntryResponse(BaseModel):
    id: int
    entry_number: Optional[str] = None
    date: datetime
    description: Optional[str] = None
    status: JournalStatus
    total_debit: float
    total_credit: float

    class Config:
        from_attributes = True


class BankAccountCreate(BaseModel):
    condominium_id: int
    bank_name: str
    account_number: str
    account_type: str = "ahorros"
    chart_account_id: Optional[int] = None
    opening_balance: float = 0.0


class BankAccountResponse(BaseModel):
    id: int
    bank_name: str
    account_number: str
    account_type: str
    opening_balance: float
    is_active: bool

    class Config:
        from_attributes = True


# ---------------------------- Helpers -----------------------------


def _ensure_accounting(user: User, db: Session, condominium_id: int):
    if not can_access_accounting(user):
        raise HTTPException(status_code=403, detail="Sin permisos contables")
    if not check_condominium_access(db, user, condominium_id):
        raise HTTPException(status_code=403, detail="Acceso denegado al condominio")


# ---------------------------- Plan de cuentas -----------------------------


@router.post("/condominium/{condominium_id}/seed", response_model=List[AccountResponse])
async def seed_chart(
    condominium_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Carga el catálogo PUC base (idempotente)."""
    _ensure_accounting(current_user, db, condominium_id)
    accounts = seed_puc_for_condominium(db, condominium_id)
    return accounts


@router.get("/condominium/{condominium_id}/accounts", response_model=List[AccountResponse])
async def list_accounts(
    condominium_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_accounting(current_user, db, condominium_id)
    return (
        db.query(ChartOfAccount)
        .filter(ChartOfAccount.condominium_id == condominium_id, ChartOfAccount.is_active.is_(True))
        .order_by(ChartOfAccount.code)
        .all()
    )


@router.post("/condominium/{condominium_id}/accounts", response_model=AccountResponse, status_code=201)
async def create_account(
    condominium_id: int,
    payload: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_accounting(current_user, db, condominium_id)
    if db.query(ChartOfAccount).filter(
        ChartOfAccount.condominium_id == condominium_id,
        ChartOfAccount.code == payload.code,
    ).first():
        raise HTTPException(status_code=400, detail="Código ya existe")
    acc = ChartOfAccount(condominium_id=condominium_id, **payload.model_dump())
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc


# ---------------------------- Asientos -----------------------------


@router.post("/journal-entries", response_model=JournalEntryResponse, status_code=201)
async def create_journal_entry(
    payload: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_accounting(current_user, db, payload.condominium_id)
    if not payload.lines:
        raise HTTPException(status_code=400, detail="Asiento requiere al menos una línea")
    total_debit = sum(l.debit for l in payload.lines)
    total_credit = sum(l.credit for l in payload.lines)
    if not totals_match(total_debit, total_credit):
        raise HTTPException(status_code=400, detail="Debe (%.2f) ≠ Haber (%.2f)" % (total_debit, total_credit))

    entry = JournalEntry(
        condominium_id=payload.condominium_id,
        entry_number=build_entry_number(db, payload.condominium_id),
        date=payload.date,
        description=payload.description,
        source_module=payload.source_module or "manual",
        status=JournalStatus.DRAFT,
        total_debit=total_debit,
        total_credit=total_credit,
        created_by=current_user.id,
    )
    db.add(entry)
    db.flush()
    for line in payload.lines:
        db.add(JournalLine(entry_id=entry.id, **line.model_dump()))
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/journal-entries/{entry_id}/post", response_model=JournalEntryResponse)
async def post_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Asiento no encontrado")
    _ensure_accounting(current_user, db, entry.condominium_id)
    if entry.status == JournalStatus.POSTED:
        return entry
    entry.status = JournalStatus.POSTED
    entry.posted_at = datetime.utcnow()
    entry.posted_by = current_user.id
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/condominium/{condominium_id}/journal-entries", response_model=List[JournalEntryResponse])
async def list_entries(
    condominium_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 100,
):
    _ensure_accounting(current_user, db, condominium_id)
    return (
        db.query(JournalEntry)
        .filter(JournalEntry.condominium_id == condominium_id)
        .order_by(JournalEntry.date.desc(), JournalEntry.id.desc())
        .limit(limit)
        .all()
    )


# ---------------------------- Bancos -----------------------------


@router.get("/condominium/{condominium_id}/bank-accounts", response_model=List[BankAccountResponse])
async def list_bank_accounts(
    condominium_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_accounting(current_user, db, condominium_id)
    return db.query(BankAccount).filter(BankAccount.condominium_id == condominium_id).all()


@router.post("/bank-accounts", response_model=BankAccountResponse, status_code=201)
async def create_bank_account(
    payload: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_accounting(current_user, db, payload.condominium_id)
    bank = BankAccount(**payload.model_dump())
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return bank


# ---------------------------- Reportes simples -----------------------------


@router.get("/condominium/{condominium_id}/trial-balance")
async def trial_balance(
    condominium_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Balance de prueba (suma debe/haber por cuenta) — solo asientos posteados."""
    _ensure_accounting(current_user, db, condominium_id)
    rows = (
        db.query(
            ChartOfAccount.id,
            ChartOfAccount.code,
            ChartOfAccount.name,
            ChartOfAccount.type,
        )
        .filter(ChartOfAccount.condominium_id == condominium_id)
        .order_by(ChartOfAccount.code)
        .all()
    )
    result = []
    for acc in rows:
        agg = (
            db.query(JournalLine)
            .join(JournalEntry, JournalEntry.id == JournalLine.entry_id)
            .filter(
                JournalLine.account_id == acc.id,
                JournalEntry.status == JournalStatus.POSTED,
            )
            .all()
        )
        debit = sum(l.debit or 0 for l in agg)
        credit = sum(l.credit or 0 for l in agg)
        if debit == 0 and credit == 0:
            continue
        result.append(
            {
                "account_id": acc.id,
                "code": acc.code,
                "name": acc.name,
                "type": acc.type.value,
                "debit": debit,
                "credit": credit,
                "balance": debit - credit,
            }
        )
    return result
