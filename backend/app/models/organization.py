from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Organization(Base):
    """Empresa administradora (tenant principal en SaaS)."""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    nit = Column(String(50), nullable=True)
    plan = Column(String(50), default="basic")  # basic, pro, enterprise
    status = Column(String(20), default="active")  # active, suspended, trial
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)  # primer tenant creado en bootstrap
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    condominiums = relationship("Condominium", back_populates="organization")
