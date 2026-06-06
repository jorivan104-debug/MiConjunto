# Mi Conjunto — Sistema de diseño

Este documento es la guía oficial del sistema visual e interacciones de **Mi Conjunto**. Acompaña a [CONSTITUCION-APP.md](./CONSTITUCION-APP.md) y rige todo lo que se ve y se siente en la aplicación.

> **Mi Conjunto no es un ERP.** Es una **plataforma comunitaria digital**. Toda decisión de diseño debe transmitir comunidad, confianza, simplicidad, organización y conexión humana.

---

## 1. Inspiración

| Producto | Cualidad que aspiramos |
|----------|------------------------|
| Airbnb | Calidez y claridad espacial |
| Notion Calendar | Organización limpia |
| Duolingo | Amigabilidad y feedback positivo |
| Linear | Precisión y fluidez |
| Arc Browser | Modernidad y sutileza |

**Light theme first.** Evitar apariencia ERP corporativa, dashboards pesados, sombras agresivas y layouts densos.

---

## 2. Paleta de color (sólo del logo)

| Token CSS | Hex | Uso semántico |
|-----------|-----|---------------|
| `--color-green` | `#39A935` | Pagos, éxito, tareas completadas, botón primario |
| `--color-blue` | `#1F66D1` | Navegación, dashboard, administración, secundario |
| `--color-red` | `#FF4040` | Alertas, mora, errores, destructivo |
| `--color-yellow` | `#F4B400` | Eventos comunitarios, anuncios, destacados |
| `--color-white` | `#FFFFFF` | Fondo principal |
| `--color-green-light` | `#EAF7E8` | Fondos suaves de éxito |
| `--color-blue-light` | `#EAF2FD` | Fondos suaves de navegación / admin |
| `--color-red-light` | `#FFE9E9` | Fondos suaves de alerta |
| `--color-yellow-light` | `#FFF4D6` | Fondos suaves de comunidad |

**Reglas:**
- No introducir colores adicionales de marca.
- Máximo dos colores con peso visual por tarjeta.
- Rojo se reserva para estados negativos / acciones destructivas.

En Tailwind se exponen como `bg-brand-green`, `bg-brand-blue-light`, `text-brand-yellow`, etc.

---

## 3. Assets de marca (`img/`)

Los tres PNG en [img/](../img) son la **fuente de verdad** del logotipo. No reemplazarlos por iconos genéricos.

| Archivo | Uso |
|---------|-----|
| `logosolo.png` | Favicon, icono PWA, sidebar colapsado, icono de app Android |
| `name.png` | Sidebar expandido, top bar, menús (nombre + slogan) |
| `Logo.png` | Login, splash, vistas principales, onboarding, header de PDFs |

Componente reutilizable: `<BrandLogo variant="full|name|icon" />` (ver [BrandLogo.tsx](../frontend/web/src/components/ui/BrandLogo.tsx)).

Copias en runtime: `frontend/web/public/brand/{logo.png, name.png, logosolo.png}` y `favicon.png`.

---

## 4. Tipografía

- **Familia principal:** Inter (Google Fonts).
- **Fallback:** Poppins.
- **Jerarquía:**

| Nivel | Peso | Tamaño |
|-------|------|--------|
| H1 | 700 | 24–30 px |
| H2 | 600 | 20–24 px |
| H3 | 600 | 18–20 px |
| Body | 400 | 14–16 px |
| Labels | 500 | 12–14 px |
| Caption | 400 | 11–12 px |

Espaciado generoso entre bloques. Evitar muros de texto.

---

## 5. Componentes (`components/ui/`)

Todos los primitivos viven en [frontend/web/src/components/ui](../frontend/web/src/components/ui):

| Componente | Comportamiento clave |
|------------|---------------------|
| `Button` | 4 variantes (primary/secondary/danger/community) + ghost/outline; hover scale 1.04, tap 0.97 |
| `Card` | Border-radius 16 px, sombra suave, lift en hover si `interactive` |
| `Input` | Floating focus (border + glow azul); altura mínima 44 px |
| `Badge` | Pílulas con tonos semánticos y dot opcional |
| `Avatar` | Iniciales o foto |
| `Dialog` | Scale + fade; overlay con blur |
| `Skeleton` | Shimmer animado para loading |
| `Toast` | Slide top-right, fade out 4.5 s |
| `BrandLogo` | 3 variantes (full/name/icon) |
| `SplashScreen` | Logo animado + barra de progreso indeterminada |
| `PageTransition` | Wrapper de fade entre rutas (220 ms) |

### Layouts

- `Sidebar` (admin desktop): colapsable; muestra `name.png` o `logosolo.png` según estado.
- `BottomNav` (mobile portal): 5 ítems con marcador animado.
- `AdminTopBar`: búsqueda + notificaciones + perfil.
- `AdminLayout`, `PortalLayout`: shells con `Outlet` y transiciones de página.

---

## 6. Motion design

Duración estándar **200–300 ms**, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Nada cambia abruptamente. Respetar `prefers-reduced-motion`.

| Elemento | Animación |
|----------|-----------|
| Botones | Scale 1.04 hover, scale 0.97 tap |
| Cards interactivas | Lift -2 px + sombra incremental |
| Inputs | Borde + glow en focus |
| Dialogs | Scale + fade (220 ms) |
| Sidebar | Slide al colapsar |
| Toasts | Slide derecha (200 ms) |
| Páginas | Fade vertical 6 px (240 ms) |
| Skeleton | Shimmer 1.5 s lineal infinito |

---

## 7. Patrones por módulo

**Dashboard.** Cards con código de color, sin sobrecarga: pagos pendientes (verde/rojo), anuncios (amarillo), eventos (amarillo), reservas (azul), PQRS (azul + badge).

**Comunidad.** Feed social ligero — anuncios, eventos y encuestas con avatares y microinteracciones.

**Pagos.** Estética fintech: paid (verde), pending (azul), overdue (rojo). Montos prominentes, badges animados.

**Admin.** Misma estética cálida; nada de tablas densas tipo ERP.

---

## 8. Accesibilidad

- Contraste mínimo AA en texto.
- Áreas táctiles ≥ 44 px en mobile.
- Foco visible con `focus-visible:ring-brand-blue`.
- Etiquetas y `alt` en todas las imágenes y botones de icono.
- Animaciones desactivables vía `prefers-reduced-motion`.

---

## 9. No-hacer

- No introducir colores fuera de la paleta.
- No usar más de dos colores con peso visual en una sección.
- No emular ERP tradicional con tablas densas y formularios infinitos.
- No reemplazar `Logo.png`, `name.png` o `logosolo.png` por texto plano donde se diseñó un asset.
- No animaciones largas o excesivas — todo bajo 320 ms salvo skeletons.
