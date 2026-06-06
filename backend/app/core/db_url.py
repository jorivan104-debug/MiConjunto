"""Construcción y normalización de DATABASE_URL (Dokploy / Docker)."""
from __future__ import annotations

from urllib.parse import quote_plus, urlparse


def build_postgres_url(
    user: str,
    password: str,
    host: str,
    port: str | int = 5432,
    database: str = "postgres",
) -> str:
    clean_host = host.lstrip("@").strip()
    return (
        f"postgresql://{quote_plus(user)}:{quote_plus(password)}"
        f"@{clean_host}:{port}/{database}"
    )


def resolve_database_url(
    database_url: str,
    *,
    postgres_host: str = "",
    postgres_user: str = "",
    postgres_password: str = "",
    postgres_db: str = "",
    postgres_port: str = "5432",
) -> str:
    """Normaliza URLs mal formadas frecuentes en paneles PaaS."""
    if postgres_host.strip():
        return build_postgres_url(
            postgres_user or "postgres",
            postgres_password,
            postgres_host,
            postgres_port or "5432",
            postgres_db or "miconjunto",
        )

    raw = (database_url or "").strip()
    if not raw:
        return "sqlite:///./miconjunto.db"

    if raw.startswith("sqlite"):
        return raw

    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql://", 1)

    # Solo hostname interno de Dokploy: @miconjunto-dbmconj-xxxxx
    if raw.startswith("@") and "://" not in raw:
        host_part = raw.lstrip("@").strip()
        host, port = host_part, postgres_port
        if ":" in host_part and "/" not in host_part:
            host, port = host_part.split(":", 1)
        return build_postgres_url(
            postgres_user or "postgres",
            postgres_password,
            host,
            port,
            postgres_db or "miconjunto",
        )

    # user:pass@host:5432/db sin esquema
    if "://" not in raw and "@" in raw:
        raw = f"postgresql://{raw}"

    # Solo hostname: miconjunto-dbmconj-bikas5
    if "://" not in raw and "@" not in raw:
        return build_postgres_url(
            postgres_user or "postgres",
            postgres_password,
            raw,
            postgres_port,
            postgres_db or "miconjunto",
        )

    return raw


def database_target_label(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme.startswith("sqlite"):
        return url
    host = parsed.hostname or "(sin host)"
    port = parsed.port or 5432
    db = (parsed.path or "/").lstrip("/") or "(sin base de datos)"
    user = parsed.username or "(sin usuario)"
    return f"postgresql://{user}:***@{host}:{port}/{db}"
