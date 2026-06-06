"""Autenticación: login (username/email), 2FA TOTP, password change y registro condicional."""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.audit import record_audit
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_pre_auth_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.core.totp import (
    decrypt_secret,
    encrypt_secret,
    generate_backup_codes,
    generate_totp_secret,
    hash_backup_code,
    make_qr_png_base64,
    provisioning_uri,
    verify_backup_code,
    verify_totp_code,
)
from app.models.role import Role
from app.models.user import User, UserBackupCode, UserRole
from app.schemas.auth import (
    LoginRequest,
    PasswordChangeRequest,
    RefreshTokenRequest,
    RegisterRequest,
    Token,
    TwoFactorBackupCodesResponse,
    TwoFactorConfirmRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
)
from app.schemas.user import UserDetailResponse, UserResponse, CondominiumInfo

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def get_user_by_identifier(db: Session, identifier: str) -> Optional[User]:
    """Busca por username o email."""
    if not identifier:
        return None
    ident = identifier.strip().lower()
    return (
        db.query(User)
        .filter(or_(User.email.ilike(ident), User.username.ilike(ident)))
        .first()
    )


def _client_meta(request: Request):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return ip, ua


def _build_full_session(user: User) -> Token:
    access = create_access_token(
        {"sub": user.email, "user_id": user.id, "username": user.username, "scope": "full"}
    )
    refresh = create_refresh_token({"sub": user.email, "user_id": user.id})
    return Token(
        access_token=access,
        refresh_token=refresh,
        needs_password_change=user.must_change_password,
        requires_2fa=False,
    )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if not settings.ALLOW_PUBLIC_REGISTRATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registro público deshabilitado. Contacta al administrador.",
        )

    if get_user_by_identifier(db, payload.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if payload.username and get_user_by_identifier(db, payload.username):
        raise HTTPException(status_code=400, detail="Username ya registrado")

    user = User(
        email=payload.email,
        username=payload.username,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
    )
    db.add(user)
    db.flush()
    default_role = db.query(Role).filter(Role.name == "user").first()
    if default_role:
        db.add(UserRole(user_id=user.id, role_id=default_role.id))
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, request: Request, db: Session = Depends(get_db)):
    identifier = credentials.get_identifier()
    ip, ua = _client_meta(request)

    user = get_user_by_identifier(db, identifier)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta inactiva")

    # Bloqueo temporal por intentos fallidos
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=429,
            detail="Cuenta bloqueada temporalmente. Intenta de nuevo más tarde.",
        )

    password = (credentials.password or "").strip()

    # Caso especial: usuario sin contraseña — primer login con email "magic" (legacy)
    if not user.hashed_password:
        if password:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        record_audit(db, user_id=user.id, action="login_passwordless", ip_address=ip, user_agent=ua)
        user.last_login_at = datetime.utcnow()
        user.must_change_password = True
        db.commit()
        return _build_full_session(user)

    if not password or not verify_password(password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            user.failed_login_attempts = 0
        db.commit()
        record_audit(
            db,
            user_id=user.id,
            action="login_failed",
            ip_address=ip,
            user_agent=ua,
            description="Contraseña inválida",
        )
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    user.failed_login_attempts = 0
    user.locked_until = None

    # 2FA activo → emitir pre_auth_token, no JWT completo
    if user.totp_enabled:
        pre_auth = create_pre_auth_token({"sub": user.email, "user_id": user.id})
        record_audit(db, user_id=user.id, action="login_pre_auth_2fa", ip_address=ip, user_agent=ua)
        db.commit()
        return Token(
            access_token="",
            refresh_token="",
            requires_2fa=True,
            pre_auth_token=pre_auth,
            needs_password_change=user.must_change_password,
        )

    user.last_login_at = datetime.utcnow()
    db.commit()
    record_audit(db, user_id=user.id, action="login_success", ip_address=ip, user_agent=ua)
    return _build_full_session(user)


@router.post("/verify-2fa", response_model=Token)
async def verify_2fa(payload: TwoFactorVerifyRequest, request: Request, db: Session = Depends(get_db)):
    decoded = decode_token(payload.pre_auth_token)
    if not decoded or decoded.get("type") != "pre_auth":
        raise HTTPException(status_code=401, detail="Token de pre-autenticación inválido")
    user_id = decoded.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active or not user.totp_enabled:
        raise HTTPException(status_code=401, detail="Sesión inválida")

    code = payload.code.strip()
    ok = False
    used_backup_id: Optional[int] = None

    # Intento como TOTP
    if user.totp_secret and verify_totp_code(user.totp_secret, code):
        ok = True
    else:
        # Intento como código de respaldo
        target_hash = hash_backup_code(code)
        for bc in user.backup_codes:
            if bc.used_at is None and verify_backup_code(bc.code_hash, code):
                ok = True
                used_backup_id = bc.id
                break

    ip, ua = _client_meta(request)
    if not ok:
        record_audit(db, user_id=user.id, action="2fa_failed", ip_address=ip, user_agent=ua)
        raise HTTPException(status_code=401, detail="Código de verificación incorrecto")

    if used_backup_id:
        bc = db.query(UserBackupCode).filter(UserBackupCode.id == used_backup_id).first()
        if bc:
            bc.used_at = datetime.utcnow()

    user.last_login_at = datetime.utcnow()
    db.commit()
    record_audit(db, user_id=user.id, action="login_success_2fa", ip_address=ip, user_agent=ua)
    return _build_full_session(user)


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    user = db.query(User).filter(User.id == decoded.get("user_id")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no válido")
    return _build_full_session(user)


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    creds_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise creds_exception
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise creds_exception

    user = (
        db.query(User)
        .options(
            joinedload(User.user_roles).joinedload(UserRole.role),
            joinedload(User.user_condominiums),
        )
        .filter(User.id == payload.get("user_id"))
        .first()
    )
    if not user or not user.is_active:
        raise creds_exception
    return user


# ---------------------------------------------------------------------------
# /me
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserDetailResponse)
async def get_current_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.user import UserCondominium

    user = (
        db.query(User)
        .options(
            joinedload(User.user_roles).joinedload(UserRole.role),
            joinedload(User.user_condominiums).joinedload(UserCondominium.condominium),
        )
        .filter(User.id == current_user.id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user_roles = [
        {"id": ur.role.id, "name": ur.role.name, "description": ur.role.description}
        for ur in user.user_roles
        if ur.role
    ]
    role_names = {r["name"] for r in user_roles}
    is_resident_role = bool(role_names & {"titular", "residente"})

    from app.models.resident import Resident
    from app.models.property import PropertyResident

    condos = []
    for uc in user.user_condominiums:
        if not uc.condominium:
            continue
        property_ids = []
        if is_resident_role:
            residents = db.query(Resident).filter(
                Resident.user_id == user.id,
                Resident.condominium_id == uc.condominium.id,
            ).all()
            for r in residents:
                prs = db.query(PropertyResident).filter(PropertyResident.resident_id == r.id).all()
                property_ids.extend([pr.property_id for pr in prs])
            property_ids = list(dict.fromkeys(property_ids))
        condos.append(
            CondominiumInfo(
                id=uc.condominium.id,
                name=uc.condominium.name,
                property_ids=property_ids if is_resident_role else None,
            )
        )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "photo_url": user.photo_url,
        "phone": user.phone,
        "document_type": user.document_type,
        "document_number": user.document_number,
        "is_active": user.is_active,
        "must_change_password": user.must_change_password,
        "totp_enabled": user.totp_enabled,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "roles": user_roles,
        "condominiums": condos,
        "needs_password_change": user.must_change_password,
    }


# ---------------------------------------------------------------------------
# Password change
# ---------------------------------------------------------------------------

@router.post("/change-password", status_code=204)
async def change_password(
    payload: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_pw = payload.new_password.strip()
    if len(new_pw) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    if new_pw.lower() == "admin":
        raise HTTPException(status_code=400, detail="No puedes usar 'admin' como contraseña")

    if not current_user.must_change_password:
        if not payload.current_password or not verify_password(
            payload.current_password, current_user.hashed_password or ""
        ):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    current_user.hashed_password = get_password_hash(new_pw)
    current_user.must_change_password = False
    current_user.password_changed_at = datetime.utcnow()
    db.commit()
    ip, ua = _client_meta(request)
    record_audit(db, user_id=current_user.id, action="password_change", ip_address=ip, user_agent=ua)


# ---------------------------------------------------------------------------
# 2FA setup / confirm / disable
# ---------------------------------------------------------------------------

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA ya está activo")
    secret = generate_totp_secret()
    encrypted = encrypt_secret(secret)
    current_user.totp_secret = encrypted
    db.commit()

    label = current_user.email or current_user.username or f"user-{current_user.id}"
    uri = provisioning_uri(encrypted, account_label=label)
    return TwoFactorSetupResponse(
        secret_preview=secret[:4] + "…",
        otpauth_uri=uri,
        qr_png_base64=make_qr_png_base64(uri),
    )


@router.post("/2fa/confirm", response_model=TwoFactorBackupCodesResponse)
async def confirm_2fa(
    payload: TwoFactorConfirmRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA ya está activo")
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Solicita primero /2fa/setup")
    if not verify_totp_code(current_user.totp_secret, payload.code.strip()):
        raise HTTPException(status_code=400, detail="Código incorrecto")

    current_user.totp_enabled = True
    current_user.totp_confirmed_at = datetime.utcnow()
    # Limpia códigos previos
    db.query(UserBackupCode).filter(UserBackupCode.user_id == current_user.id).delete()
    backups = generate_backup_codes(8)
    for code in backups:
        db.add(UserBackupCode(user_id=current_user.id, code_hash=hash_backup_code(code)))
    db.commit()

    ip, ua = _client_meta(request)
    record_audit(db, user_id=current_user.id, action="2fa_enabled", ip_address=ip, user_agent=ua)
    return TwoFactorBackupCodesResponse(codes=backups)


@router.delete("/2fa", status_code=204)
async def disable_2fa(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.totp_enabled = False
    current_user.totp_secret = None
    current_user.totp_confirmed_at = None
    db.query(UserBackupCode).filter(UserBackupCode.user_id == current_user.id).delete()
    db.commit()
    ip, ua = _client_meta(request)
    record_audit(db, user_id=current_user.id, action="2fa_disabled", ip_address=ip, user_agent=ua)


@router.post("/2fa/backup-codes/regenerate", response_model=TwoFactorBackupCodesResponse)
async def regenerate_backup_codes(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if not current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA no está activo")
    db.query(UserBackupCode).filter(UserBackupCode.user_id == current_user.id).delete()
    backups = generate_backup_codes(8)
    for code in backups:
        db.add(UserBackupCode(user_id=current_user.id, code_hash=hash_backup_code(code)))
    db.commit()
    return TwoFactorBackupCodesResponse(codes=backups)
