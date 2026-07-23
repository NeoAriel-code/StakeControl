# Webhook de Resend y seguridad de entregabilidad

## Objetivo

Registrar de forma autenticada el ciclo de entrega de correos transaccionales y evitar nuevos correos no esenciales hacia direcciones que rebotaron o marcaron spam, sin almacenar direcciones de email en texto plano dentro de los logs de entrega.

## Entrada autenticada

`POST /api/webhooks/resend` recibirá el cuerpo crudo del webhook y verificará los encabezados Svix mediante `resend.webhooks.verify` y `RESEND_WEBHOOK_SECRET`. Las firmas inválidas o encabezados ausentes responderán sin modificar datos.

El endpoint procesará `email.delivered`, `email.bounced`, `email.complained`, `email.failed` y `email.delivery_delayed`. Los demás eventos se aceptarán como no operativos para permitir futuras extensiones.

## Persistencia

`EmailDelivery` conservará el `providerMessageId` devuelto al enviar y añadirá el último evento y sus marcas de tiempo de entrega, rebote, queja, fallo o demora. Se añadirá una clave de idempotencia para el identificador de evento del proveedor.

Una tabla separada `RestrictedEmailAddress` guardará únicamente el SHA-256 del destinatario, la razón (`BOUNCED` o `COMPLAINED`) y sus fechas. No se guardará el destinatario plano ni el cuerpo del mensaje.

## Política de envío

Antes de enviar mensajes no esenciales, el servicio consultará el hash del destinatario y omitirá la entrega si está restringido. Los mensajes de seguridad (verificación, recuperación y aviso de contraseña) no se suprimirán.

Un rebote, queja, fallo o demora de un correo de seguridad dejará una alerta de cuenta visible dentro de la aplicación. Esta alerta no contiene el correo; identifica el tipo de problema, cuándo ocurrió y recomienda actualizar contacto o pedir soporte.

## Idempotencia y consistencia

El identificador Svix del webhook se guarda como único. Reintentos de Resend no duplican la actualización de entrega, la restricción ni la alerta. Los eventos se enlazan por `providerMessageId`; si no hay una entrega conocida, se registran como procesados sin crear datos de usuario.

## Configuración y validación

Se agregará `RESEND_WEBHOOK_SECRET` vacío a `.env.example` y se añadirá en Vercel Production. Después del despliegue, se creará el webhook en Resend apuntando a `https://app.getstakecontrol.com/api/webhooks/resend` con los cinco eventos soportados.

Las pruebas cubrirán firma ausente o inválida, transición de eventos, idempotencia, hash del destinatario, supresión de correos no esenciales y preservación de los correos de seguridad.
