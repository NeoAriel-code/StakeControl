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
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación. | Sí al desplegar. |
| `NODE_ENV` | Modo de ejecución; producción bloquea proveedores mock/local. | La plataforma normalmente la define. |
| `OCR_PROVIDER` | Proveedor OCR explícito. | Sí al usar OCR; en producción debe ser cloud. |
| `GOOGLE_VISION_CREDENTIALS_JSON` | Credenciales del proveedor `google_vision`. | Sí cuando `OCR_PROVIDER=google_vision`. |
| `TESSERACT_BIN`, `TESSERACT_LANG` | OCR local experimental. | Solo desarrollo; no permitido en producción. |
| `AI_PROVIDER` | Proveedor de extracción IA. | Sí al usar IA; en producción debe ser `openai`. |
| `OPENAI_API_KEY` | Credencial del proveedor OpenAI. | Sí cuando `AI_PROVIDER=openai`. |
| `AI_TICKET_PRIMARY_MODEL`, `AI_TICKET_FALLBACK_MODEL` | Modelos de extracción de tickets. | Opcionales. |
| `AI_REPORT_PRIMARY_MODEL`, `AI_REPORT_FALLBACK_MODEL` | Modelos de análisis responsable. | Opcionales. |
| `AI_TICKET_TIMEOUT_MS` | Límite de tiempo de extracción de tickets. | Opcional. |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Almacenamiento privado Supabase. | Sí en producción con almacenamiento Supabase. |
| `SUPABASE_STORAGE_BUCKET` | Bucket privado de tickets. | Opcional; usa el bucket predeterminado si no se define. |
| `TURSO_AUTH_TOKEN` | Token para una conexión Turso remota. | Opcional, según `DATABASE_URL`. |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM` | Entrega de recuperación de contraseña. | Requeridas solo al activar envío de correo. |
| `PLAN_TESTER_EMAILS`, `DEMO_DATA_EMAILS` | Controles privados de QA. | Opcionales; no documentar valores personales. |

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
```

GitHub Actions ejecuta lint, typecheck, pruebas y build en cada pull request y cambio a `main`.

## Seguridad

Consulta [SECURITY.md](SECURITY.md) para reportar vulnerabilidades de forma privada.
