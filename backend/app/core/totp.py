"""Generación, cifrado y verificación de secretos TOTP (2FA).

Los secretos se cifran con Fernet antes de persistirse. La clave se deriva del
SECRET_KEY si no se configura una explícita en `TOTP_ENCRYPTION_KEY`.
"""
import base64
import hashlib
import secrets
from typing import List, Tuple

import pyotp
import qrcode
from cryptography.fernet import Fernet, InvalidToken
from io import BytesIO

from app.core.config import settings


def _fernet_key() -> bytes:
    raw = settings.TOTP_ENCRYPTION_KEY or settings.SECRET_KEY
    digest = hashlib.sha256(raw.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_fernet_key())


def generate_totp_secret() -> str:
    """Genera un secreto base32 para TOTP."""
    return pyotp.random_base32()


def encrypt_secret(secret: str) -> str:
    return _fernet.encrypt(secret.encode("utf-8")).decode("utf-8")


def decrypt_secret(token: str) -> str:
    try:
        return _fernet.decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Invalid encrypted TOTP secret") from exc


def verify_totp_code(encrypted_secret: str, code: str) -> bool:
    if not encrypted_secret or not code:
        return False
    try:
        secret = decrypt_secret(encrypted_secret)
    except ValueError:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def provisioning_uri(encrypted_secret: str, account_label: str, issuer: str = "Mi Conjunto") -> str:
    secret = decrypt_secret(encrypted_secret)
    return pyotp.TOTP(secret).provisioning_uri(name=account_label, issuer_name=issuer)


def make_qr_png_base64(uri: str) -> str:
    img = qrcode.make(uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def generate_backup_codes(count: int = 8) -> List[str]:
    """Genera códigos de respaldo legibles."""
    return [
        "-".join(secrets.token_hex(2).upper() for _ in range(2))  # XXXX-XXXX
        for _ in range(count)
    ]


def hash_backup_code(code: str) -> str:
    return hashlib.sha256(code.upper().strip().encode("utf-8")).hexdigest()


def verify_backup_code(stored_hash: str, code: str) -> bool:
    return hash_backup_code(code) == stored_hash
