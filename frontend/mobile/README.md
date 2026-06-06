# Mi Conjunto — App Android (Expo)

App nativa para residentes y copropietarios. Comparte la misma API FastAPI del backend.

## Inicio rápido

```bash
cd frontend/mobile
npm install
npx expo start --android   # emulador o dispositivo físico
```

Por defecto el cliente apunta a `http://10.0.2.2:8000` (emulador Android Studio reachable a `localhost` del host). Para dispositivo físico, edita `app.json` → `extra.apiUrl` con la IP local de tu máquina (`http://192.168.x.x:8000`).

## Estructura

```
src/
├── components/      # UI primitives (Button, Card, Input, Badge, BrandLogo)
├── navigation/      # RootNavigator + MainTabs (5 tabs)
├── screens/         # Login, 2FA, PasswordChange, Dashboard, Pagos, Comunidad, PQRS, Perfil
├── services/api.ts  # Axios + JWT
├── store/           # Zustand
├── theme/tokens.ts  # Colores, radios, tipografía
└── utils/           # Helpers de formato
```

## Tabs principales

1. **Inicio** — saldo pendiente, anuncios, próximas asambleas
2. **Pagos** — cuentas de cobro y estados (paid/pending/overdue)
3. **Comunidad** — feed de anuncios, eventos y conversaciones
4. **PQRS** — formulario de solicitudes (anónimo opcional)
5. **Perfil** — datos personales, 2FA, cerrar sesión

## Identidad

- Light theme.
- Colores estrictos del logo: `#39A935`, `#1F66D1`, `#FF4040`, `#F4B400`.
- Iconos de marca desde `assets/icon.png` y splash desde `assets/splash.png`.

## Build de producción

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

Genera AAB para Google Play o APK para distribución directa.
