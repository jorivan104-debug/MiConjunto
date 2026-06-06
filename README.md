# Mi Conjunto

**Plataforma comunitaria digital** para gestión de propiedad horizontal en Colombia. Web (admin + portal residente) + app Android nativa, con backend FastAPI multi-tenant y contabilidad PUC.

## Estructura

```
MiConjunto2/
├── backend/          # API FastAPI + PostgreSQL + Alembic
├── frontend/
│   ├── web/          # React + Vite + Tailwind + Framer Motion
│   └── mobile/       # React Native + Expo (Android)
├── docs/
│   ├── CONSTITUCION-APP.md   # Dominios funcionales y principios
│   └── DESIGN-SYSTEM.md      # Sistema visual y motion
├── img/              # Assets de marca (logosolo, name, Logo)
└── Sounds/           # Sonidos opcionales de notificación
```

## Inicio rápido (con Docker)

```bash
docker compose up --build
```

- API: http://localhost:8000 (docs en `/docs`)
- Web: http://localhost:5173
- Postgres: localhost:5432 (`miconjunto/miconjunto`)

**Primer ingreso:** `admin` / `admin` (cambio de contraseña obligatorio).

## Desarrollo local sin Docker

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate           # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload    # http://localhost:8000
```

Por defecto usa SQLite (`miconjunto.db`). Para PostgreSQL define `DATABASE_URL` en `.env`.

### Frontend web

```bash
cd frontend/web
npm install
npm run dev                       # http://localhost:5173
```

### App Android (Expo)

```bash
cd frontend/mobile
npm install
npx expo start --android
```

## Identidad

- **Light theme**, colores estrictos del logo: `#39A935 #1F66D1 #FF4040 #F4B400 #FFFFFF`.
- Tipografía Inter (fallback Poppins).
- Microinteracciones con Framer Motion (200–300 ms).
- Ver [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

## Capacidades

- Multi-tenant (organización → condominios)
- Auth con username/email, 2FA TOTP opcional
- Maestro PH (unidades, residentes, coeficiente)
- Contabilidad PUC con doble partida
- Cuentas de cobro a residentes con líneas
- Inventario y bodegas con kardex
- Órdenes de trabajo de mantenimiento
- Foro comunitario y denuncias
- Asambleas con quórum por coeficiente
- Portal residente y app Android

## Licencia

Privado.
