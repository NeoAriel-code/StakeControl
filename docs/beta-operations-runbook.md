# Operación de la beta cerrada

Este runbook define el gate operativo para abrir StakeControl a 100–200 usuarios. Cada simulacro debe conservar fecha, operador, entorno, comandos ejecutados, tiempos y evidencia en el registro interno de operaciones. No se debe declarar aprobado un paso que solo fue revisado en documentación.

## Restauración de Turso

Objetivo inicial: RPO máximo de 24 horas y RTO máximo de 2 horas. Deben reemplazarse por los resultados medidos del primer simulacro.

1. Confirmar el plan de Turso y anotar la ventana PITR efectiva. No asumir una retención que el plan no incluya.
2. Seleccionar un instante anterior conocido y restaurarlo en una base nueva; nunca sobre producción.
3. Ejecutar las migraciones administradas contra la base restaurada y configurar un preview aislado con su URL y token.
4. Verificar conteos de `User`, `Bet`, `BetTicketImage`, `AIExtraction` y `AdminAccessAudit`; comprobar además login, dashboard y una exportación CSV.
5. Medir desde el inicio de la restauración hasta el smoke test correcto (RTO) y calcular la distancia entre el instante recuperado y el incidente simulado (RPO).
6. Destruir las credenciales temporales y conservar solo evidencia sin secretos. La base restaurada se elimina después de la revisión.

## Backup y recuperación de tickets

Los backups de base de datos no contienen objetos de Supabase Storage. El bucket privado `SUPABASE_STORAGE_BUCKET` requiere una copia separada, cifrada y con acceso restringido.

1. Ejecutar diariamente una copia incremental del bucket a almacenamiento independiente con cifrado y versionado.
2. Guardar un manifiesto con referencia del objeto, tamaño, tipo MIME, checksum SHA-256 y fecha; no incluir texto OCR.
3. Aplicar lifecycle de 30 días máximo tanto a objetos eliminados como a versiones y manifiestos. No habilitar retenciones indefinidas.
4. En cada simulacro, elegir un `BetTicketImage`, restaurar su objeto en un bucket aislado, verificar checksum y abrirlo mediante una ruta autenticada.
5. Confirmar que eliminar una cuenta elimina el objeto operativo y que cualquier copia residual vence dentro de 30 días.

## Sentry y CSP

1. Configurar `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` y `SENTRY_PROJECT` en preview y producción. El token nunca es público.
2. Desplegar preview y revisar el log de build para confirmar la subida de source maps.
3. Provocar un error controlado sin datos personales y confirmar que aparece con stack original, release y entorno correctos.
4. Ejecutar smoke desktop y móvil y comprobar que no hay bloqueos CSP para `*.ingest.sentry.io` ni `*.ingest.us.sentry.io`.
5. Cloudflare Browser Insights debe permanecer deshabilitado. Si se propone activarlo, requiere revisión de privacidad y consentimiento antes del cambio.

## Alertas mínimas

- `GET /api/health` distinto de 200 durante dos comprobaciones consecutivas.
- aumento de errores Sentry o fallos de workflow por encima del 1% durante cinco minutos.
- consumo de Turso, Vercel, Supabase, OpenAI o Resend por encima de 70% y 90% de su presupuesto.
- fallo del backup diario o ausencia de una restauración probada en los últimos 30 días.
- ejecución fallida de la limpieza diaria de `RateLimitBucket`.

## Gate de apertura

La beta solo se abre cuando CI, E2E de preview, health check, evento Sentry con source map, k6 con 250 VU y ambos simulacros de recuperación tienen evidencia aprobada. Cualquier resultado pendiente mantiene `REGISTRATION_ENABLED=false` hasta su resolución.
