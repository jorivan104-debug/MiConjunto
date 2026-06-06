"""Inicialización resiliente de base de datos para despliegues Docker/Dokploy."""
import logging
import time

from sqlalchemy import text

from app.core.database import Base, engine

logger = logging.getLogger(__name__)


def init_database(max_attempts: int = 45, delay_seconds: float = 2.0) -> None:
    """Espera a PostgreSQL y crea tablas si no existen."""
    logger.info("Initializing database schema...")
    last_error: Exception | None = None

    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            Base.metadata.create_all(bind=engine)
            logger.info("Database ready (attempt %s/%s)", attempt, max_attempts)
            return
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Database not ready (attempt %s/%s): %s",
                attempt,
                max_attempts,
                exc,
            )
            time.sleep(delay_seconds)

    raise RuntimeError(
        f"Database initialization failed after {max_attempts} attempts"
    ) from last_error
