from typing import Optional, List
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """El usuario ingresa username o email en el mismo campo `identifier`."""
    identifier: Optional[str] = Field(default=None, description="username o email")
    # Compatibilidad: aceptamos también `email` y `username` como aliases
    email: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = ""

    def get_identifier(self) -> str:
        return (self.identifier or self.email or self.username or "").strip()


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    username: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    needs_password_change: Optional[bool] = False
    requires_2fa: Optional[bool] = False
    pre_auth_token: Optional[str] = None


class TwoFactorVerifyRequest(BaseModel):
    pre_auth_token: str
    code: str = Field(..., description="Código TOTP de 6 dígitos o código de respaldo XXXX-XXXX")


class TwoFactorSetupResponse(BaseModel):
    secret_preview: str  # primeros 4 chars para confirmación
    otpauth_uri: str
    qr_png_base64: str


class TwoFactorConfirmRequest(BaseModel):
    code: str


class TwoFactorBackupCodesResponse(BaseModel):
    codes: List[str]


class PasswordChangeRequest(BaseModel):
    current_password: Optional[str] = None  # opcional si el usuario tiene must_change_password
    new_password: str = Field(..., min_length=8)
