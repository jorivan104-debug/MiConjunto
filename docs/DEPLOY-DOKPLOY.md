# Despliegue en Dokploy — Mi Conjunto

## Error común: "Nixpacks was unable to generate a build plan"

Ocurre cuando Dokploy clona **todo el repositorio** y usa **Nixpacks** en la raíz. El monorepo no es una app Node/Python en la raíz; el backend está en `backend/`.

### Solución (backend)

En la aplicación del backend en Dokploy → **General** / **Build**:

| Campo | Valor |
|-------|-------|
| **Build Type** | `Dockerfile` (no Nixpacks) |
| **Dockerfile** | `Dockerfile` |
| **Build context / Root directory** | `.` (raíz del repo) |
| **Port** | `8000` |

El `Dockerfile` en la raíz del repo construye el backend copiando `backend/`.

**Alternativa:** Build Type Dockerfile, Dockerfile `backend/Dockerfile`, context `backend`.

---

## 1. PostgreSQL

1. Proyecto → **Database** → **PostgreSQL**
2. Anota usuario, contraseña y nombre de BD
3. URL interna (ejemplo):

```text
postgresql://usuario:clave@nombre-servicio-postgres:5432/miconjunto
```

Usa el **hostname interno** que muestra Dokploy (no `localhost`).

---

## 2. Backend (API)

**Dominio:** `api.tudominio.com`  
**Puerto contenedor:** `8000`

### Variables de entorno

```env
DATABASE_URL=postgresql://usuario:clave@HOST-INTERNO-POSTGRES:5432/miconjunto
APP_ENV=production
SECRET_KEY=genera-una-clave-larga-y-aleatoria
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_PASSWORD=admin
BOOTSTRAP_ADMIN_EMAIL=admin@miconjunto.app
CORS_ORIGINS=["https://app.tudominio.com"]
ALLOW_PUBLIC_REGISTRATION=false
```

### Volumen (recomendado)

- Ruta en contenedor: `/app/uploads`

### Health check

- Path: `/health`

### Verificar

- `https://api.tudominio.com/health` → `{"status":"healthy"}`
- `https://api.tudominio.com/docs` → Swagger

### Bad Gateway / contenedor `Exited (1)`

Revisa los **logs** del contenedor en Dokploy. Causas frecuentes:

1. **Puerto incorrecto** — en Dokploy el puerto del contenedor debe ser `8000` (coincide con `PORT=8000`).
2. **`DATABASE_URL` mal configurada** — usa el hostname **interno** de PostgreSQL en Dokploy, no `localhost`.
   - Ejemplo: `postgresql://usuario:clave@miconjunto-db-xxxxx:5432/miconjunto`
   - También funciona si Dokploy entrega `postgres://...` (se normaliza automáticamente).
3. **`CORS_ORIGINS` mal formateado** — válido como JSON o lista separada por comas:
   - `["https://app.tudominio.com"]`
   - `https://app.tudominio.com`
4. **PostgreSQL aún no listo** — el backend reintenta hasta ~60 s; si la BD no existe o la clave es incorrecta, seguirá fallando.

En **Environment**, usa **una** de estas dos formas:

**Opción A — URL completa (recomendada):**

```env
DATABASE_URL=postgresql://postgres:TU_CLAVE@miconjunto-dbmconj-bikas5:5432/miconjunto
```

**Opción B — variables separadas (recomendada en Dokploy):**

```env
POSTGRES_HOST=miconjunto-dbmconj-bikas5
POSTGRES_USER=postgres
POSTGRES_PASSWORD=TU_CLAVE
POSTGRES_DB=miconjunto
POSTGRES_PORT=5432
```

Si Dokploy inyecta automáticamente una `DATABASE_URL` incorrecta (p. ej. `@miconjunto-dbmconj-bikas5`), **elimínala** y usa solo las variables `POSTGRES_*` de arriba.

**Importante:** `POSTGRES_PASSWORD` es obligatoria (cópiala del servicio PostgreSQL en Dokploy).

Tras el redeploy, en logs debe aparecer:

```text
PostgreSQL TCP target: postgresql://postgres:***@miconjunto-dbmconj-bikas5:5432/miconjunto
```

Si el host sigue mostrando `@miconjunto-...`, las variables no se guardaron correctamente.

También necesitas:

```env
APP_ENV=production
SECRET_KEY=clave-larga-aleatoria
```

En Dokploy, vincula la base de datos al backend (**Connect to Application** / misma red Docker).

---


## 3. Frontend web

**Dominio:** `app.tudominio.com`  
**Puerto contenedor:** `80`

| Campo | Valor |
|-------|-------|
| **Build Type** | `Dockerfile` |
| **Dockerfile** | `frontend/web/Dockerfile` |
| **Build context** | `frontend/web` |
| **Port** | `80` |

### Variable de entorno (obligatoria)

**Opción A — URL pública del API (HTTPS):**

```env
BACKEND_URL=https://api.tudominio.com
```

**Opción B — red interna Dokploy (recomendada si el 502 persiste):**

En el servicio **backend** → General, copia el nombre interno del contenedor y usa:

```env
BACKEND_URL=http://miconjunto-bend-egwsrw:8000
```

(sustituye por el nombre real de tu servicio backend; sin barra final)

Nginx hace proxy de `/api` y `/uploads`. Sin `BACKEND_URL` → **405**. Si el proxy no alcanza el API público desde el contenedor → **502**.

En el **backend**, CORS con el dominio del frontend:

```env
CORS_ORIGINS=https://miconjunto.app-sprint.com
```

**Alternativa:** build con `VITE_API_URL=https://api.tudominio.com/api` (sin proxy nginx).

---

## 4. Primer acceso

1. Despliega backend (espera a que `/health` responda)
2. Despliega frontend
3. Abre `https://app.tudominio.com`
4. Login: `admin` / `admin` → cambio de contraseña obligatorio

---

## 5. App móvil (Android)

En `frontend/mobile/app.json`:

```json
"extra": {
  "apiUrl": "https://api.tudominio.com"
}
```

Compilar con Expo/EAS fuera de Dokploy.
