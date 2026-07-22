# Resend y preferencias de notificaciones por correo

## Objetivo

Integrar Resend para correo transaccional desde `StakeControl <no-reply@notify.getstakecontrol.com>` y permitir que cada usuario decida qué alertas de juego responsable recibe por email.

## Alcance

- Recuperación de contraseña: envío transaccional siempre disponible cuando Resend está configurado.
- Bienvenida: un único correo después de registrar una cuenta.
- Alertas por email: límite cercano, límite superado, aumento de stake, racha de pérdidas, frecuencia alta y pausa sugerida.
- Preferencias: decisión inicial durante onboarding y ajustes individuales posteriores desde Configuración.
- Registro de entrega: persistir el resultado de cada intento para evitar duplicados y diagnosticar fallos.

No se incluyen campañas, newsletter, correos de marketing ni reintentos asíncronos programados.

## Configuración de producción

Vercel Production debe contener:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=<secreto de Resend>
EMAIL_FROM=StakeControl <no-reply@notify.getstakecontrol.com>
```

El dominio emisor `notify.getstakecontrol.com` debe mantenerse verificado en Resend. La clave queda restringida a envío desde ese dominio.

## Arquitectura

### Adaptador de correo

Un módulo de servidor centralizará la configuración de Resend y las plantillas de texto/HTML. Validará que proveedor, clave y remitente existan antes de enviar. Los errores del proveedor se registrarán de forma segura y devolverán un resultado de fallo, nunca la clave ni datos sensibles.

### Eventos que envían correo

- `welcome`: al completar la creación de una cuenta. La entrega se ejecuta como tarea secundaria para no impedir el registro.
- `password_reset`: al solicitar recuperación. Si el proveedor falla, no se revelará si existe la cuenta; la acción mantendrá la misma respuesta genérica actual y registrará el error.
- `responsible_gaming_alert`: solo cuando el sistema crea una alerta nueva, no cuando reutiliza una alerta existente por deduplicación.

Cada correo de alerta enlazará a la sección autenticada correspondiente y no incluirá detalles innecesarios de apuestas.

### Preferencias

Se almacenará una preferencia por usuario con:

- un consentimiento inicial de alertas por email;
- una selección por cada `AlertType` existente;
- valores explícitos para que nuevas categorías tengan una política definida.

En onboarding, el usuario responderá si quiere recibir alertas por email y verá que puede cambiarlas después. Al aceptar, se activan todos los tipos actuales; al rechazar, se desactivan todos. En Configuración podrá modificar cada tipo individualmente.

La recuperación de contraseña no usa estas preferencias. El correo de bienvenida se entrega una vez y tampoco depende de ellas.

### Entregas y deduplicación

Una tabla de entregas conservará el tipo de correo, usuario, alerta asociada cuando exista, estado, identificador de Resend y fechas relevantes. Tendrá una restricción única para una alerta y canal de correo, de forma que no se reenvíe al reevaluar datos o reintentar una acción.

Los envíos de alertas se harán después de crear la alerta y fuera de transacciones de apuestas/límites. Si fallan, la alerta interna sigue disponible y la acción principal se considera exitosa.

## Seguridad y privacidad

- La API key solo vive en Vercel y no se expone al cliente ni se registra.
- Los correos de recuperación no confirman la existencia de una cuenta.
- No habrá marketing ni enlaces de desuscripción porque el alcance es transaccional/preventivo; las alertas tienen controles propios dentro de la app.
- Las preferencias y entregas estarán siempre acotadas al usuario autenticado.

## Pruebas

- Configuración válida e inválida del adaptador de Resend.
- Recuperación y bienvenida delegan al adaptador sin exponer datos.
- Onboarding crea las preferencias correctas para ambas decisiones.
- Configuración individual actualiza solo el tipo elegido y respeta el usuario actual.
- Una alerta nueva con preferencia activa crea una entrega; una desactivada no.
- Repetir la evaluación no duplica el correo de una misma alerta.
- Un fallo de envío no revierte una apuesta, límite ni alerta interna.
