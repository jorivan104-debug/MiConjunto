"""Construcción y normalización de DATABASE_URL (Dokploy / Docker)."""
from __future__ import annotations

from urllib.parse import quote_plus, unquote, urlparse


class DatabaseConfigError(ValueError):
    """DATABASE_URL o variables POSTGRES_* inválidas."""


def build_postgres_url(
    user: str,
    password: str,
    host: str,
    port: str | int = 5432,
    database: str = "postgres",
) -> str:
    clean_host = host.lstrip("@").strip()
    if not clean_host:
        raise DatabaseConfigError(
            "Host de PostgreSQL vacío. Configura POSTGRES_HOST o una DATABASE_URL completa."
        )

    user_q = quote_plus(user or "postgres")
    port_s = str(port or 5432)
    db = (database or "postgres").strip("/") or "postgres"

    # Nunca generar postgres:@host — con contraseña vacía el @ confunde al parser.
    if password:
        creds = f"{user_q}:{quote_plus(password)}"
    else:
        creds = user_q

    return f"postgresql://{creds}@{clean_host}:{port_s}/{db}"


def sanitize_postgres_url(url: str) -> str:
    """Reconstruye la URL para evitar hosts con @ por parseo incorrecto."""
    if not url.startswith("postgresql"):
        return url

    parsed = urlparse(url)
    user = unquote(parsed.username or "postgres")
    password = unquote(parsed.password) if parsed.password is not None else ""
    host = parsed.hostname or ""
    port = parsed.port or 5432
    database = (parsed.path or "/postgres").lstrip("/") or "postgres"

    # Caso postgres:@miconjunto-dbmconj-bikas5 — el host quedó en "password"
    if password.startswith("@"):
        host = password.lstrip("@").split(":")[0]
        password = ""
    elif not host and "@" in parsed.netloc:
        userinfo, hostport = parsed.netloc.rsplit("@", 1)
        user = userinfo.split(":", 1)[0] if userinfo else user
        if ":" in userinfo:
            password = userinfo.split(":", 1)[1]
        else:
            password = ""
        host = hostport.split(":")[0].lstrip("@")
        if ":" in hostport:
            port = hostport.split(":")[1]

    return build_postgres_url(user, password, host, port, database)


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

    return sanitize_postgres_url(raw)


def database_target_label(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme.startswith("sqlite"):
        return url
    host = parsed.hostname or "(sin host)"
    port = parsed.port or 5432
    db = (parsed.path or "/").lstrip("/") or "(sin base de datos)"
    user = parsed.username or "(sin usuario)"
    return f"postgresql://{user}:***@{host}:{port}/{db}"


def postgres_connection_params(
    database_url: str,
    *,
    postgres_host: str = "",
    postgres_user: str = "",
    postgres_password: str = "",
    postgres_db: str = "",
    postgres_port: str = "5432",
) -> dict[str, str | int]:
    """Parámetros TCP explícitos para psycopg2 (evita sockets Unix en Dokploy)."""
    if postgres_host.strip():
        host = postgres_host.lstrip("@").strip()
        if not host:
            raise DatabaseConfigError("POSTGRES_HOST está vacío.")
        return {
            "host": host,
            "port": int(postgres_port or 5432),
            "user": postgres_user or "postgres",
            "password": postgres_password or "",
            "dbname": postgres_db or "miconjunto",
        }

    raw = (database_url or "").strip()

    if raw.startswith("@") and "://" not in raw:
        host_part = raw.lstrip("@").strip()
        host = host_part.split(":")[0]
        port = int(host_part.split(":")[1]) if ":" in host_part else int(postgres_port or 5432)
        return {
            "host": host,
            "port": port,
            "user": postgres_user or "postgres",
            "password": postgres_password or "",
            "dbname": postgres_db or "miconjunto",
        }

    url = resolve_database_url(
        database_url,
        postgres_host=postgres_host,
        postgres_user=postgres_user,
        postgres_password=postgres_password,
        postgres_db=postgres_db,
        postgres_port=postgres_port,
    )
    parsed = urlparse(url)
    user = unquote(parsed.username or "postgres")
    password = unquote(parsed.password) if parsed.password is not None else ""
    host = (parsed.hostname or "").lstrip("@")
    port = int(parsed.port or postgres_port or 5432)
    dbname = (parsed.path or "/").lstrip("/") or "miconjunto"

    if password.startswith("@"):
        host = password.lstrip("@").split(":")[0]
        password = ""
    elif not host and "@" in (parsed.netloc or ""):
        _, hostport = parsed.netloc.rsplit("@", 1)
        host = hostport.split(":")[0].lstrip("@")
        if ":" in hostport:
            port = int(hostport.split(":")[1])

    if not host:
        raise DatabaseConfigError(
            "No se pudo determinar POSTGRES_HOST. En Dokploy define POSTGRES_HOST, "
            "POSTGRES_USER, POSTGRES_PASSWORD y POSTGRES_DB."
        )

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "dbname": dbname,
    }


def connection_target_label(params: dict[str, str | int]) -> str:
    return (
        f"postgresql://{params['user']}:***@{params['host']}:"
        f"{params['port']}/{params['dbname']}"
    )
