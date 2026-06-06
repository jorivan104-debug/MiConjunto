import logging

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.db_url import connection_target_label, postgres_connection_params

logger = logging.getLogger(__name__)

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    logger.info("Database engine target: %s", settings.DATABASE_URL)
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=False,
        connect_args=connect_args,
    )
else:
    pg_params = postgres_connection_params(
        settings.DATABASE_URL,
        postgres_host=settings.POSTGRES_HOST,
        postgres_user=settings.POSTGRES_USER,
        postgres_password=settings.POSTGRES_PASSWORD,
        postgres_db=settings.POSTGRES_DB,
        postgres_port=settings.POSTGRES_PORT,
    )
    logger.info("PostgreSQL TCP target: %s", connection_target_label(pg_params))
    engine = create_engine(
        "postgresql+psycopg2://",
        connect_args=pg_params,
        pool_pre_ping=True,
        echo=False,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
