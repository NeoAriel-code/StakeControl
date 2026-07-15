# QA, datos demo y recuperación de contraseña — diseño

## Objetivo

Limitar estrictamente la carga de datos demo a dos cuentas QA y preparar un flujo seguro de recuperación de contraseña que pueda activar entrega de correo cuando `getstakecontrol.com` y un proveedor transaccional estén configurados.

## Cuentas y permisos de demo

La cuenta QA será `qa@getstakecontrol.com`; su contraseña se generará aleatoriamente al provisionarla y se comunicará una sola vez al propietario del proyecto. La otra cuenta autorizada será `arielalfaro.94@gmail.com`.

Se añadirá la variable de entorno `DEMO_DATA_EMAILS`, con ambas direcciones separadas por comas. Será independiente de `PLAN_TESTER_EMAILS` para no acoplar permisos de datos demo con controles de plan.

Se creará una utilidad de autorización específica. La interfaz de carga se renderizará solo para una cuenta autorizada, y la acción de servidor rechazará de forma explícita cualquier solicitud de otra cuenta. Las rutas `/health` y `/dashboard` conservarán la capacidad de demo solo para los autorizados.

## Recuperación de contraseña preparada para email

Se añadirá una entidad de token de recuperación con usuario, hash del token, vencimiento, fecha de uso y fecha de creación. Los tokens serán aleatorios, de un solo uso y con vencimiento breve; solo el hash se guardará en la base de datos. Solicitar una recuperación invalidará los tokens sin usar anteriores de esa cuenta.

Se añadirán las rutas públicas `/forgot-password` y `/reset-password`, acciones de servidor y formularios. La solicitud responderá de manera no enumeradora: no revelará si un correo está registrado. El restablecimiento validará token, vencimiento, uso único y confirmación de contraseña antes de guardar el nuevo hash.

## Entrega transaccional diferida

El código definirá una interfaz de entrega de recuperación. Mientras no exista `EMAIL_PROVIDER=resend` y `RESEND_API_KEY`, el servicio se considera no configurado y la pantalla de solicitud explica que la recuperación por email no está disponible todavía, sin emitir ni revelar enlaces de restablecimiento.

Cuando el dominio y Resend estén configurados, solo se añadirá el adaptador que envía el enlace absoluto basado en `NEXT_PUBLIC_APP_URL`; los tokens, tablas, rutas, formularios y validaciones ya estarán preparados. El correo de soporte continuará siendo `contact@getstakecontrol.com`.

## Seguridad y operación

La configuración de producción deberá exigir `AUTH_SECRET`; se elimina el secreto de desarrollo por defecto en producción. La recuperación aplicará límites de solicitud por correo y, cuando se implemente un almacenamiento de límites compartido, por IP. En esta entrega se mantiene el límite existente como protección básica y se documenta que no es distribuido.

## Pruebas y despliegue

Las pruebas cubrirán autorización de datos demo, emisión/consumo de tokens, rechazo de tokens vencidos o usados, y la respuesta de proveedor de correo no configurado. La migración de Prisma se aplicará a la base remota antes de publicar la funcionalidad. Luego se configurará `DEMO_DATA_EMAILS` en Vercel Production y se creará la cuenta QA en la base de producción.

## Fuera de alcance

No se configura Resend, no se compra ni verifica un dominio, no se envían correos, no se implementa rate limiting distribuido y no se habilitan pagos.

