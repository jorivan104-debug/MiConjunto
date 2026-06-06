import json
from typing import Any, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Mi Conjunto"
    APP_ENV: str = "development"  # development | production

    # Database
    # Default: SQLite for dev. Override with DATABASE_URL=postgresql://... in production.
    DATABASE_URL: str = "sqlite:///./miconjunto.db"

    # JWT
    SECRET_KEY: str = "change-me-in-production-please-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    PRE_AUTH_TOKEN_EXPIRE_MINUTES: int = 5  # for 2FA flow

    # 2FA encryption key (Fernet) — derive from SECRET_KEY by default
    TOTP_ENCRYPTION_KEY: str = ""  # if empty, derive from SECRET_KEY

    # Bootstrap admin (used only when DB is empty)
    BOOTSTRAP_ADMIN_USERNAME: str = "admin"
    BOOTSTRAP_ADMIN_PASSWORD: str = "admin"
    BOOTSTRAP_ADMIN_EMAIL: str = "admin@miconjunto.app"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:19006",  # Expo web
    ]

    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Public registration (false = solo admin crea usuarios)
    ALLOW_PUBLIC_REGISTRATION: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: Any) -> Any:
        if isinstance(value, str) and value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql://", 1)
        return value

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> Any:
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                return json.loads(raw)
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return value


settings = Settings()
