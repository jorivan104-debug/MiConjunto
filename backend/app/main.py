"""Mi Conjunto — API principal."""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.seed import run_initial_seed
from app.core.startup import init_database

# Importar todos los modelos para registrarlos con Base
from app import models  # noqa: F401

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.APP_ENV)
    init_database()
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True, parents=True)
    try:
        run_initial_seed()
    except Exception:
        logger.exception("Seed failed (continuing)")
    yield


app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="API de Mi Conjunto — plataforma comunitaria multi-tenant.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    if response.status_code >= 400:
        logger.warning("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response


app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# Routers existentes (legacy) que se mantienen
from app.api import (  # noqa: E402
    auth,
    condominiums,
    blocks,
    residents,
    properties,
    accounting,
    space_requests,
    meetings,
    assemblies,
    documents,
    notifications,
    document_attachments,
    users,
    profile,
    administration_invoices,
)

# Nuevos routers (Mi Conjunto)
from app.api import (  # noqa: E402
    organizations,
    accounting_puc,
    billing,
    inventory,
    maintenance,
    forum,
    reports,
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(organizations.router, prefix="/api/organizations", tags=["Organizations (SaaS)"])
app.include_router(condominiums.router, prefix="/api/condominiums", tags=["Condominios"])
app.include_router(blocks.router, prefix="/api/blocks", tags=["Bloques"])
app.include_router(residents.router, prefix="/api/residents", tags=["Residentes"])
app.include_router(properties.router, prefix="/api/properties", tags=["Propiedades"])
app.include_router(accounting.router, prefix="/api/accounting", tags=["Contabilidad (legacy)"])
app.include_router(accounting_puc.router, prefix="/api/accounting-puc", tags=["Contabilidad PUC"])
app.include_router(administration_invoices.router, prefix="/api/administration-invoices", tags=["Facturas administración (legacy)"])
app.include_router(billing.router, prefix="/api/billing", tags=["Cuentas de cobro"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventario"])
app.include_router(maintenance.router, prefix="/api/maintenance", tags=["Mantenimiento"])
app.include_router(forum.router, prefix="/api/forum", tags=["Comunidad"])
app.include_router(space_requests.router, prefix="/api/space-requests", tags=["Solicitudes de espacios"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["Reuniones"])
app.include_router(assemblies.router, prefix="/api/assemblies", tags=["Asambleas"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documentos"])
app.include_router(document_attachments.router, prefix="/api/document-attachments", tags=["Adjuntos"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notificaciones"])
app.include_router(users.router, prefix="/api/users", tags=["Usuarios"])
app.include_router(profile.router, prefix="/api/profile", tags=["Perfil"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reportes y auditoría"])


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
