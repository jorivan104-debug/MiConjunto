from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=True, index=True)  # login alterno
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    photo_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    document_type = Column(String(50), nullable=True)
    document_number = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False, nullable=False)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # 2FA / TOTP
    totp_enabled = Column(Boolean, default=False, nullable=False)
    totp_secret = Column(String(512), nullable=True)  # cifrado en reposo (Fernet)
    totp_confirmed_at = Column(DateTime(timezone=True), nullable=True)

    # Failed login attempts
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    user_condominiums = relationship("UserCondominium", back_populates="user", cascade="all, delete-orphan")
    backup_codes = relationship("UserBackupCode", back_populates="user", cascade="all, delete-orphan")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role")


class UserCondominium(Base):
    __tablename__ = "user_condominiums"
    __table_args__ = (UniqueConstraint("user_id", "condominium_id", name="uq_user_condominium"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False)
    # Rol específico en este condominio (admin, accountant, titular, residente, etc.)
    role_in_condominium = Column(String(50), nullable=True)

    user = relationship("User", back_populates="user_condominiums")
    condominium = relationship("Condominium", back_populates="user_condominiums")


class UserBackupCode(Base):
    """Códigos de respaldo de un solo uso para 2FA."""
    __tablename__ = "user_backup_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code_hash = Column(String(255), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="backup_codes")
