"""Configuración común de tests con SQLite por sesión."""
import os
import pathlib

# Usamos una ruta única en /tmp por ejecución de tests para evitar bloqueos en Windows.
_TEST_DB_PATH = pathlib.Path(__file__).resolve().parent.parent / f"test_miconjunto_{os.getpid()}.db"
TEST_DB_URL = f"sqlite:///{_TEST_DB_PATH.as_posix()}"

# Configurar variables de entorno ANTES de importar la app para que `Settings` las recoja.
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-only-not-secure")
os.environ.setdefault("BOOTSTRAP_ADMIN_USERNAME", "admin")
os.environ.setdefault("BOOTSTRAP_ADMIN_PASSWORD", "admin")
os.environ.setdefault("APP_ENV", "test")

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def app_client():
    # Importar dentro del fixture para asegurar que las env vars ya están configuradas.
    from app.core.database import Base, engine
    from app.main import app
    from app.core.seed import run_initial_seed

    Base.metadata.create_all(bind=engine)
    run_initial_seed()
    with TestClient(app) as client:
        yield client

    # Limpieza
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    try:
        if _TEST_DB_PATH.exists():
            _TEST_DB_PATH.unlink()
    except OSError:
        pass


@pytest.fixture
def client(app_client):
    return app_client
