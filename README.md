<p align="center"><img src="packages/design/marca/logo.png" alt="Mi Conjunto" width="180"></p>

# Mi Conjunto

Plataforma para administrar propiedad horizontal en Colombia (conjuntos, edificios y condominios). Une en un solo lugar el cobro de cuotas por coeficiente, los pagos, la contabilidad, la comunicación con residentes, las PQRS y las reservas de zonas comunes, siguiendo la Ley 675 de 2001.

Este repositorio contiene el **MVP** definido en [docs/BASES.md](docs/BASES.md).

## Qué incluye

| Módulo | Qué hace |
| --- | --- |
| Copropiedades y unidades | Torres, unidades, coeficientes (en %), importación desde Excel, propietarios, residentes y arrendatarios |
| Roles | Administrador, asistente, contador, consejo, revisor fiscal, propietario, residente y portería; cada uno ve solo lo suyo |
| Cobros y cartera | Presupuesto anual, liquidación mensual por coeficiente con fondo de imprevistos (mín. 1 %), cuotas extraordinarias, multas, intereses de mora con el tope legal, cartera por edades, certificado de deuda (título ejecutivo) y paz y salvo |
| Pagos | Registro por la administración, reporte del residente con soporte, pago en línea con Wompi (PSE y tarjetas), imputación primero a intereses y luego a lo más antiguo, saldos a favor |
| Contabilidad propia | Cada cobro, pago e interés genera su asiento de partida doble; libro diario y balance de prueba. Los asientos no se editan: se anulan con un asiento inverso |
| Comunicados | Circulares con confirmación de lectura |
| PQRS | Radicado consecutivo, responsable, estados, respuesta y conversación |
| Reservas | Zonas comunes con horario, duración máxima, cupos, aprobación y cobro (con IVA si la copropiedad es responsable) |
| Documentos | Reglamento, actas, estados financieros y pólizas con visibilidad por rol |
| Datos personales | Autorización de tratamiento con fecha y versión (Ley 1581 de 2012) y registro de auditoría de acciones sensibles |

## Estructura

```
apps/
  api/        API REST — NestJS + Prisma + PostgreSQL (documentación en /api/docs)
  web/        Panel del administrador y portal del residente — Next.js + Tailwind
  mobile/     App del residente — React Native + Expo
packages/
  design/     Identidad visual: tokens, preset de Tailwind, tema móvil y logos
docs/         Bases del producto, sistema de diseño y despliegue
```

## Arranque rápido con Docker

```bash
docker compose up --build
docker compose exec api npx ts-node prisma/seed.ts   # datos de demostración (opcional)
```

- Web: http://localhost:3000
- API: http://localhost:4000/api — documentación: http://localhost:4000/api/docs

## Desarrollo local

Requisitos: Node.js 22 y PostgreSQL 16.

```bash
npm install                                   # instala API, web y diseño
cp apps/api/.env.example apps/api/.env        # ajusta DATABASE_URL y JWT_SECRET
cp apps/web/.env.example apps/web/.env.local
npm run db:migrate                            # crea las tablas
npm run db:seed                               # datos de demostración
npm run dev:api                               # http://localhost:4000/api
npm run dev:web                               # http://localhost:3000
npm test                                      # pruebas unitarias de la API
npm run test:e2e -w apps/api                  # ciclo de cobro contra PostgreSQL
```

App móvil (instalación aparte):

```bash
cd apps/mobile && npm install && npx expo start
```

En el emulador de Android la app usa `http://10.0.2.2:4000/api`; cámbialo en `apps/mobile/app.json` (`extra.apiUrl`) para un celular físico.

### Cuentas de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Superadministrador | admin@miconjunto.app | Admin12345! |
| Propietaria (Torre 1 - 101) | residente@demo.co | Demo12345! |
| Contadora | contador@demo.co | Demo12345! |
| Consejo | consejo@demo.co | Demo12345! |

## Configuración importante

- **Tasa de mora:** cada mes el superadministrador registra el interés bancario corriente certificado por la Superintendencia Financiera (`PUT /api/tasas-interes`). La app calcula el tope legal de 1,5 veces esa tasa, en su equivalente mensual. Los datos de demostración usan una tasa de **ejemplo** del 17 % E.A.
- **Pagos en línea:** define `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` y configura en Wompi el webhook `https://tu-api/api/webhooks/wompi`. Pruébalo primero en el sandbox de Wompi.
- **IVA:** marca la copropiedad como responsable de IVA si cobra el uso de zonas comunes. La factura electrónica DIAN se integrará con un proveedor tecnológico en la fase 2.

## Documentación

- [Bases del producto y hoja de ruta](docs/BASES.md)
- [Sistema de diseño](docs/DISENO.md)
- [Despliegue en Dokploy](docs/DESPLIEGUE.md)
