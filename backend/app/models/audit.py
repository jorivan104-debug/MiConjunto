"""Auditoría transversal de acciones críticas."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # login, password_change, 2fa_enable, etc.
    entity_type = Column(String(50), nullable=True)  # user, payment, vote, etc.
    entity_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    extra = Column(JSON, nullable=True)  # data adicional
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
