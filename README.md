# Mi Conjunto

Plataforma web para administración de copropiedad (propiedad horizontal): portal de residente y panel de administración (demo con datos mock).

## Estructura

- `app/` — Aplicación [Next.js](https://nextjs.org/) (TypeScript, Tailwind CSS)
- `docs/` — Documentación del producto (`CONSTITUCION-APP.md`)

## Desarrollo

```bash
cd app
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Rutas útiles: `/dashboard` (residente), `/admin` (administración demo).

## Despliegue (Dokploy / Nixpacks)

El repositorio tiene **`package.json` en la raíz** para que Nixpacks detecte Node aunque el código Next.js esté en **`app/`**. Los scripts `build` y `start` ejecutan `cd app && …`.

Si usas **Docker** en Dokploy, en la raíz hay un **`Dockerfile`** listo (contexto = raíz del repo).

En Dokploy puedes dejar el directorio raíz del servicio en **`.`** (raíz del repo); no hace falta apuntar solo a `app` si usas esta configuración.

## Licencia

Privado / uso del autor salvo que se indique lo contrario.
