# Despliegue en Dokploy

Se despliegan tres servicios: PostgreSQL, la API y la web. Los Dockerfile se construyen **desde la raíz del repositorio**.

## 1. PostgreSQL

Crea una base PostgreSQL 16 en Dokploy y copia su URL interna, por ejemplo `postgresql://usuario:clave@servicio-postgres:5432/ph`.

## 2. API

| Campo | Valor |
| --- | --- |
| Build type | Dockerfile |
| Dockerfile | `apps/api/Dockerfile` |
| Build context | `.` |
| Puerto | `4000` |
| Volumen | `/repo/apps/api/uploads` |

Variables:

```env
DATABASE_URL=postgresql://usuario:clave@servicio-postgres:5432/ph
JWT_SECRET=una-clave-aleatoria-de-al-menos-32-caracteres
CORS_ORIGINS=https://app.tudominio.com
UPLOADS_DIR=/repo/apps/api/uploads
WOMPI_PUBLIC_KEY=
WOMPI_INTEGRITY_SECRET=
WOMPI_EVENTS_SECRET=
WOMPI_REDIRECT_URL=https://app.tudominio.com/
```

Las migraciones se aplican solas al arrancar (`prisma migrate deploy`). Para crear el primer superadministrador, ejecuta en la consola del contenedor `npx ts-node prisma/seed.ts` (crea también un conjunto de demostración que puedes borrar después) o crea el usuario directamente en la base con `esSuperAdmin = true`.

Verificación: `GET https://api.tudominio.com/api/salud`.

## 3. Web

| Campo | Valor |
| --- | --- |
| Build type | Dockerfile |
| Dockerfile | `apps/web/Dockerfile` |
| Build context | `.` |
| Build arg | `NEXT_PUBLIC_API_URL=https://api.tudominio.com/api` |
| Puerto | `3000` |

`NEXT_PUBLIC_API_URL` se fija al construir la imagen: si cambia el dominio de la API, hay que reconstruir la web.
