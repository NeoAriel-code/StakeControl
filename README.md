# StakeControl

StakeControl es una aplicación web para registrar actividad de apuestas, revisar exposición histórica y mantener límites visibles. No entrega picks, predicciones ni recomendaciones de apuesta.

## Principios

- No recomienda mercados, selecciones ni casas de apuesta.
- No promete rentabilidad ni recuperación de pérdidas.
- No incentiva aumentar stake.
- Trata apuestas, tickets, reportes y alertas como datos privados del usuario.
- Mantiene revisión humana obligatoria para tickets procesados con OCR e IA.

## Stack

- Next.js 16 App Router
- TypeScript, Tailwind CSS v4 y Zod
- Prisma 7 con SQLite/libSQL en desarrollo
- Node.js 24
- Node test runner con `tsx`

## Setup local

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

Copie `.env.example` para desarrollo. Nunca agregue valores reales, tokens, JSON de cuentas de servicio ni correos personales al repositorio, README o logs.

| Variable | Uso | Requerida |
| --- | --- | --- |
| `DATABASE_URL` | Conexión Prisma/libSQL. | Sí, todos los entornos. |
| `AUTH_SECRET` | Firma de sesiones. | Sí, todos los entornos. |
| `REGISTRATION_ENABLED` | Interruptor operativo para detener nuevas altas sin cerrar el login. | Opcional; por defecto habilitado. |
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación. | Sí al desplegar. |
| `NODE_ENV` | Modo de ejecución; producción bloquea proveedores mock/local. | La plataforma normalmente la define. |
| `OCR_PROVIDER` | Proveedor OCR explícito. | Sí al usar OCR; en producción debe ser cloud. |
| `GOOGLE_VISION_CREDENTIALS_JSON` | Credenciales del proveedor `google_vision`. | Sí cuando `OCR_PROVIDER=google_vision`. |
| `TESSERACT_BIN`, `TESSERACT_LANG` | OCR local experimental. | Solo desarrollo; no permitido en producción. |
| `AI_PROVIDER` | Proveedor global y de análisis responsable; los reportes productivos permanecen en OpenAI. | Sí al usar IA; en producción debe disponer de OpenAI. |
| `OPENAI_API_KEY` | Credencial OpenAI para reportes y fallback de tickets. | Sí en producción. |
| `AI_TICKET_PRIMARY_PROVIDER`, `AI_TICKET_FALLBACK_PROVIDER` | Proveedores de tickets; durante la beta aceptan OpenAI (o mock solo fuera de producción). | Opcionales. DeepSeek está bloqueado. |
| `AI_TICKET_PRIMARY_MODEL`, `AI_TICKET_FALLBACK_MODEL` | Modelos de extracción de tickets. | Opcionales. |
| `AI_REPORT_PRIMARY_MODEL`, `AI_REPORT_FALLBACK_MODEL` | Modelos de análisis responsable. | Opcionales. |
| `AI_TICKET_OPENAI_FALLBACK_LIMIT_PER_MINUTE` | Tope global de fallback para evitar cascadas de costo o 429. | Opcional. |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Almacenamiento privado Supabase. | Sí en producción con almacenamiento Supabase. |
| `SUPABASE_STORAGE_BUCKET` | Bucket privado de tickets. | Opcional; usa el bucket predeterminado si no se define. |
| `TURSO_AUTH_TOKEN` | Token para una conexión Turso remota. | Opcional, según `DATABASE_URL`. |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM` | Entrega de recuperación de contraseña. | Requeridas solo al activar envío de correo. |
| `PLAN_TESTER_EMAILS`, `DEMO_DATA_EMAILS` | Controles privados de QA. | Opcionales; no documentar valores personales. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Clave pública para analítica de producto opcional. | Opcional; sin ella no se inicializa analítica. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Host de ingesta PostHog. | Opcional; usa PostHog Cloud de EE. UU. por defecto. |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` | Ingesta de errores saneados. | Recomendadas en producción. |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Subida de source maps durante build. | Requeridas para source maps legibles. |
| `CRON_SECRET` | Autoriza la limpieza diaria de rate limits. | Sí en Vercel. |
| `TRUST_CLOUDFLARE_PROXY` | Permite usar `CF-Connecting-IP` solo cuando Cloudflare es proxy confiable. | Opcional; `false` por defecto. |

### Analítica de producto

StakeControl solicita consentimiento antes de inicializar PostHog. La integración usa solamente eventos de uso con un catálogo cerrado; no envía apuestas, tickets, texto OCR, importes, identificadores de cuenta ni URLs. En el proyecto de PostHog deben permanecer desactivados Autocapture, Session Replay, perfiles de personas, feature flags y error tracking.

El servicio solo acepta imágenes JPG, PNG y WEBP para tickets; PDF no está habilitado. En producción, OCR, IA y almacenamiento fallan de forma segura si la configuración no es válida.

## Rutas principales

- `/dashboard`: resumen de actividad.
- `/health`: salud de juego, score preventivo y alertas.
- `/bets`: historial y registro manual.
- `/tickets`: carga y revisión humana de tickets.
- `/limits`: límites personales y pausas voluntarias.
- `/analysis`: análisis responsable premium.
- `/reports/export`: exportación CSV segura.
- `/settings` y `/profile`: preferencias, seguridad y cuenta.

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run test:e2e
```

GitHub Actions ejecuta lint, typecheck, pruebas y build en cada pull request y cambio a `main`.
Los E2E críticos se ejecutan por separado contra preview con las variables descritas en `playwright.config.ts`.

## Seguridad

Consulta [SECURITY.md](SECURITY.md) para reportar vulnerabilidades de forma privada.
