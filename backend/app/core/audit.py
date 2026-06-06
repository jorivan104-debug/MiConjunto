"""Helper para registrar eventos en `audit_logs`."""
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def record_audit(
    db: Session,
    *,
    user_id: Optional[int],
    action: str,
    description: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    extra: Optional[Dict[str, Any]] = None,
    condominium_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        condominium_id=condominium_id,
        action=action,
        description=description,
        entity_type=entity_type,
        entity_id=entity_id,
        extra=extra,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    db.commit()
    return log
