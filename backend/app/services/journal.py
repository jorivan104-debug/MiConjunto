"""Helpers para la creación de asientos contables."""
from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

from app.models.accounting_puc import (
    JournalEntry,
    JournalLine,
    JournalStatus,
)


def totals_match(total_debit: float, total_credit: float, tolerance: float = 0.01) -> bool:
    return abs(total_debit - total_credit) <= tolerance


def build_entry_number(db: Session, condominium_id: int) -> str:
    last = (
        db.query(JournalEntry)
        .filter(JournalEntry.condominium_id == condominium_id)
        .order_by(JournalEntry.id.desc())
        .first()
    )
    next_seq = (last.id + 1) if last else 1
    year = datetime.utcnow().year
    return f"AS-{year}-{next_seq:06d}"


def post_simple_entry(
    db: Session,
    *,
    condominium_id: int,
    date: datetime,
    description: str,
    source_module: str,
    source_id: int,
    debit_account_id: int,
    credit_account_id: int,
    amount: float,
    third_party_id: int | None = None,
    user_id: int | None = None,
) -> JournalEntry:
    """Crea y postea un asiento de dos líneas (débito vs crédito)."""
    if amount <= 0:
        raise ValueError("amount must be positive")
    entry = JournalEntry(
        condominium_id=condominium_id,
        entry_number=build_entry_number(db, condominium_id),
        date=date,
        description=description,
        source_module=source_module,
        source_id=source_id,
        status=JournalStatus.POSTED,
        total_debit=amount,
        total_credit=amount,
        created_by=user_id,
        posted_by=user_id,
        posted_at=datetime.utcnow(),
    )
    db.add(entry)
    db.flush()
    db.add(
        JournalLine(
            entry_id=entry.id,
            account_id=debit_account_id,
            debit=amount,
            credit=0.0,
            third_party_id=third_party_id,
            description=description,
        )
    )
    db.add(
        JournalLine(
            entry_id=entry.id,
            account_id=credit_account_id,
            debit=0.0,
            credit=amount,
            third_party_id=third_party_id,
            description=description,
        )
    )
    return entry
