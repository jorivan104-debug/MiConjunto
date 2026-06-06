"""Seed inicial: roles, organización por defecto, usuario admin/admin.

Ejecutado en el startup de FastAPI cuando la base de datos está vacía.
Idempotente: nunca crea datos si ya existen.
"""
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)


DEFAULT_ROLES = [
    ("super_admin", "Administrador de plataforma (operador SaaS)"),
    ("admin", "Administrador del condominio"),
    ("accountant", "Contador"),
    ("accounting_assistant", "Auxiliar de contabilidad"),
    ("asesor", "Asesor del consejo de administración"),
    ("titular", "Propietario titular de una unidad"),
    ("residente", "Residente de una unidad (no necesariamente propietario)"),
    ("user", "Usuario general sin rol específico"),
]


def seed_roles(db: Session) -> None:
    for name, description in DEFAULT_ROLES:
        existing = db.query(Role).filter(Role.name == name).first()
        if not existing:
            db.add(Role(name=name, description=description))
    db.commit()


def seed_default_organization(db: Session) -> Organization:
    org = db.query(Organization).filter(Organization.is_default.is_(True)).first()
    if org:
        return org
    org = Organization(
        name="Mi Conjunto",
        slug="mi-conjunto",
        plan="enterprise",
        status="active",
        is_default=True,
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def seed_initial_admin(db: Session) -> None:
    """Crea el usuario admin/admin si no hay ningún usuario en la BD."""
    existing_count = db.query(User).count()
    if existing_count > 0:
        return

    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    if not super_admin_role:
        seed_roles(db)
        super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()

    seed_default_organization(db)

    admin = User(
        username=settings.BOOTSTRAP_ADMIN_USERNAME,
        email=settings.BOOTSTRAP_ADMIN_EMAIL,
        full_name="Administrador",
        hashed_password=get_password_hash(settings.BOOTSTRAP_ADMIN_PASSWORD),
        is_active=True,
        must_change_password=True,
    )
    db.add(admin)
    db.flush()
    db.add(UserRole(user_id=admin.id, role_id=super_admin_role.id))
    db.commit()
    logger.info(
        "Bootstrap admin created: username=%s (must_change_password=True)",
        settings.BOOTSTRAP_ADMIN_USERNAME,
    )


def run_initial_seed() -> None:
    db = SessionLocal()
    try:
        seed_roles(db)
        seed_default_organization(db)
        seed_initial_admin(db)
    except Exception:  # pragma: no cover
        db.rollback()
        logger.exception("Initial seed failed")
        raise
    finally:
        db.close()
