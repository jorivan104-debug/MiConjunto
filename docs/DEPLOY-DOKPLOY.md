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

### Build argument (obligatorio)

```env
VITE_API_URL=https://api.tudominio.com
```

Sin esto, el frontend intentará llamar a `/api` en el mismo dominio y fallará.

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
