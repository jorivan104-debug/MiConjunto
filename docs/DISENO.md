# Sistema de diseño

La identidad visual viene de MiConjunto y vive en `packages/design`. Web y móvil usan los mismos valores.

## Principios

Plataforma comunitaria, no ERP: tema claro, espacio generoso, tarjetas redondeadas, sombras suaves y animaciones cortas (200 a 300 ms, curva `cubic-bezier(0.22, 1, 0.36, 1)`), desactivables con `prefers-reduced-motion`.

## Colores

| Color | Hex | Uso |
| --- | --- | --- |
| Verde | `#39A935` | Pagos, éxito (iconos, superficies) |
| Verde oscuro | `#1F7C3A` | Botón primario y texto verde (contraste 5,3:1) |
| Azul | `#1F66D1` | Navegación, administración, foco |
| Rojo | `#FF4040` | Mora, alertas (iconos, bordes) |
| Rojo oscuro | `#D92B2B` | Botón destructivo y texto de mora (4,9:1) |
| Amarillo | `#F4B400` | Comunidad, anuncios, eventos |
| Azul marino | `#01234C` | Títulos (del logotipo) |

Cada color tiene un fondo suave (`*-light`) para insignias y tarjetas. Máximo dos colores con peso visual por tarjeta.

## Tipografía

Inter para todo; Poppins para títulos. H1 700, H2 y H3 600, cuerpo 400, etiquetas 500.

## Componentes web

`apps/web/src/components/ui.tsx`: `Boton` (primary, secondary, danger, community, ghost, outline), `Tarjeta`, `Campo`, `AreaTexto`, `Selector`, `Insignia`, `Estado`, `Dato`, `Dialogo`, `Vacio`, `Cargando`, avisos y `Logo` (completo, nombre, ícono).

## Logos

| Archivo | Uso |
| --- | --- |
| `logo.png` | Login, splash, certificados |
| `name.png` | Barra lateral y encabezados |
| `logosolo.png` | Barra colapsada, favicon |
