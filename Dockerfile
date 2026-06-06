# Backend API — despliegue desde la raíz del monorepo (Dokploy / Docker).
# Build context: raíz del repositorio (.)
# Puerto expuesto: 8000

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY backend/ .

RUN mkdir -p uploads && chmod +x scripts/docker-entrypoint.sh

EXPOSE 8000

ENV PORT=8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
    CMD sh -c 'curl -f http://127.0.0.1:${PORT:-8000}/health || exit 1'

CMD ["scripts/docker-entrypoint.sh"]
