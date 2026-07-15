# StakeControl

StakeControl es una aplicación web para registrar actividad de apuestas, revisar exposición histórica y mantener límites visibles. No entrega picks, predicciones ni recomendaciones de apuesta.

## Principios

- No recomienda mercados, selecciones ni casas de apuesta.
- No promete rentabilidad ni recuperación de pérdidas.
- No incentiva aumentar stake.
- Trata apuestas, tickets, reportes y alertas como datos privados del usuario.
- Usa lenguaje preventivo: límites, rachas, exposición, pausa y revisión.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Prisma 7
- SQLite/libSQL local en desarrollo
- Zod para validación
- Node test runner con `tsx`

## Setup Local

1. Instalar dependencias:

```bash
npm install
```

2. Configurar `.env`:

```bash
cp .env.example .env
```

3. Aplicar migraciones y generar Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

4. Levantar desarrollo:

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Procesamiento De Tickets En Produccion

La carga de tickets acepta únicamente imágenes JPG, PNG y WEBP; los PDF no son aceptados. El OCR debe configurarse explícitamente: si no está disponible o no puede procesar una imagen, la carga falla de forma segura y no se genera texto de reemplazo. La revisión humana sigue siendo obligatoria: el OCR es ayuda, no fuente final de verdad.

Para desplegar en producción, configura estas variables sensibles:

```env
AUTH_SECRET="un-secreto-largo-y-aleatorio"
OCR_PROVIDER="google_vision"
GOOGLE_VISION_CREDENTIALS_JSON='{"type":"service_account",...}'
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
SUPABASE_URL="https://project.supabase.co"
SUPABASE_SECRET_KEY="sb_secret_..."
```

En producción, Google Vision procesa las imágenes mediante `DOCUMENT_TEXT_DETECTION`, OpenAI estructura el texto OCR y Supabase Storage almacena los archivos privados. `AUTH_SECRET` también es obligatorio en todos los entornos.

### IA Para Estructurar Tickets

La IA recibe solo el texto OCR saneado, no el archivo ni identificadores personales. La extracción usa salida estructurada, no guarda una apuesta automáticamente y mantiene la revisión humana como paso obligatorio. Si el proveedor no responde, el ticket queda disponible para completar manualmente.

Para ajustar los modelos de IA en Vercel, configura estas variables opcionales en `Production` y `Preview`:

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
AI_TICKET_PRIMARY_MODEL="gpt-4.1-mini"
AI_TICKET_FALLBACK_MODEL="gpt-5-mini"
AI_TICKET_TIMEOUT_MS="8000"
AI_REPORT_PRIMARY_MODEL="gpt-5-mini"
AI_REPORT_FALLBACK_MODEL="gpt-4.1-mini"
```

Las apuestas simples se guardan con una selección. Las múltiples y los Bet Builders conservan sus selecciones individuales con evento, mercado, elección, cuota y resultado. Antes de desplegar una versión que use esta estructura, aplica las migraciones pendientes en Turso.

### Control Privado De Planes

Para alternar rápidamente entre Free y Premium durante QA, define los emails autorizados en Vercel:

```env
PLAN_TESTER_EMAILS="arielalfaro.94@gmail.com"
```

Solo los correos incluidos verán el control en `/profile`; el servidor vuelve a validar el permiso antes de cambiar la suscripción. No procesa pagos.

## Rutas De La Aplicación

- `/`: landing publica.
- `/register`: registro.
- `/login`: inicio de sesion.
- `/onboarding`: setup inicial responsable.
- `/dashboard`: resumen principal.
- `/health`: salud de juego y datos demo.
- `/bets`: historial de apuestas.
- `/bets/new`: registro manual.
- `/tickets`: carga y revisión de tickets con OCR.
- `/limits`: limites y pausas voluntarias.
- `/alerts`: historial de alertas.
- `/analysis`: analisis IA responsable premium.
- `/reportes`: hub de reportes.
- `/reports/export`: exportacion CSV.
- `/settings`: preferencias y seguridad.
- `/profile`: perfil, documentos y eliminacion de cuenta.
- `/terms` y `/privacy`: documentacion legal basica.

Rutas legacy mantenidas por compatibilidad:

- `/historial` redirige a `/bets`.
- `/registrar` redirige a `/bets/new`.
- `/terminos` redirige a `/terms`.

## Guion De Demo V1

1. Abrir `/` y mostrar la propuesta: bitacora privada para apuestas deportivas.
2. Crear cuenta en `/register`.
3. Completar `/onboarding`:
   - elegir deportes principales,
   - definir limites iniciales,
   - aceptar reglas responsables.
4. Entrar a `/health`.
5. Usar `Cargar datos demo` si la cuenta esta vacia.
6. Revisar que `/dashboard` muestre metricas, exposicion y apuestas recientes.
7. Ir a `/bets` y cambiar un resultado desde el selector rapido.
8. Revisar `/alerts` y marcar alertas como leidas desde el navbar.
9. Revisar `/limits` y activar o modificar limites/pausa.
10. Descargar CSV en `/reports/export`.
11. Probar `/analysis` con usuario Free y Premium para validar bloqueo de plan.
12. Cerrar sesion desde el menu de usuario.

## Datos Demo

La pagina `/health` incluye una accion para crear datos demo del usuario autenticado:

- genera mas de 30 apuestas historicas,
- configura limites iniciales,
- crea alertas preventivas,
- es idempotente: no duplica si ya existen tickets demo con prefijo `DEMO-STC`.

Los datos demo pertenecen solo al usuario autenticado.

## Verificacion

Ejecutar antes de declarar una version como estable:

```bash
npx tsc --noEmit
npm run lint
git diff --check
npm test
npm run build
```

La suite actual cubre:

- metricas criticas,
- salud de juego,
- alertas responsables,
- permisos por `userId`,
- validaciones Zod,
- configuración explícita de proveedores OCR y almacenamiento,
- bloqueo premium/free,
- filtro de salida del analisis IA responsable,
- exportacion CSV.

## Limites Conocidos

- No hay pasarela de pago real.
- La carga de tickets no acepta PDF; solo admite JPG, PNG y WEBP.
- No se conectan cuentas de sportsbooks.
- No se guardan credenciales de casas de apuesta.
- La base local es SQLite/libSQL; para produccion se debe migrar a un proveedor administrado como Supabase u otro backend elegido.
- Las rutas legacy se mantienen solo como redirecciones.

## Comandos Utiles

```bash
npm run dev
npm test
npm run build
npx tsc --noEmit
npx prisma migrate dev
npx prisma generate
```
