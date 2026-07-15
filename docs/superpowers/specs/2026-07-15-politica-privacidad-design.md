# Política de privacidad de StakeControl — diseño

## Objetivo

Reemplazar la política básica del MVP por una política de privacidad clara, accesible y coherente con el tratamiento de datos implementado y los proveedores configurables de StakeControl.

## Alcance

La página `/privacy` será actualizada. No se modificarán los flujos de producto, la configuración de proveedores ni el mecanismo de eliminación de cuentas en este cambio.

## Responsable y contacto

- Responsable: StakeControl.
- Canal de privacidad: `privacy@getstakecontrol.com`.

## Datos y finalidades

La política explicará que StakeControl trata datos de cuenta (correo, nombre opcional y preferencias), configuración y confirmaciones, historial de apuestas, límites, alertas, tickets y sus metadatos, resultados de OCR y reportes/análisis.

Estos datos se usan para crear y administrar la cuenta, almacenar y mostrar el historial, procesar tickets, generar métricas, reportes y alertas de autocontrol, proteger el servicio, atender solicitudes de soporte y gestionar suscripciones cuando correspondan.

No se almacenan credenciales de casas de apuestas ni se conectan cuentas externas de apuestas.

## Proveedores y transferencias

StakeControl no vende datos personales. Para operar el servicio puede utilizar proveedores que procesan información por cuenta de StakeControl:

- Vercel para hosting y despliegue.
- Turso/libSQL para la base de datos de producción.
- Supabase Storage para archivos privados de tickets, solo cuando se configure ese proveedor.
- Google Cloud Vision para OCR, solo cuando se configure ese proveedor.
- OpenAI para extracción estructurada y análisis de IA, solo cuando se configure ese proveedor.

El texto indicará que esos proveedores pueden procesar datos fuera de Chile conforme a sus regiones operativas y acuerdos aplicables. No incluirá AWS, Azure, email transaccional ni analytics, porque el repositorio no evidencia una integración activa para ellos.

## IA

Cuando la funcionalidad de IA está habilitada, se envían a su proveedor el texto extraído del ticket y los datos necesarios para la extracción o el análisis solicitado. La IA es una herramienta de apoyo: no toma decisiones automáticas con efectos legales o equivalentes, no determina resultados de apuestas y no sustituye el criterio del usuario.

## Retención y eliminación

Los datos se conservan mientras la cuenta permanezca activa. Al eliminar la cuenta, StakeControl elimina los datos operativos y los archivos privados asociados. Las copias de seguridad pueden conservarse por hasta 30 días; una conservación adicional solo procederá cuando una obligación legal aplicable lo exija.

## Derechos, menores y cookies

La política detallará los derechos de acceso, rectificación, supresión y portabilidad, ejercibles por correo electrónico y sujetos al plazo legal aplicable. El servicio es exclusivamente para mayores de edad. Se describirá el uso de cookies y almacenamiento local esenciales; cualquier analítica futura exigirá actualizar esta política y, cuando corresponda, el aviso o consentimiento correspondiente.

## Presentación y pruebas

La información se dividirá en secciones breves y legibles, manteniendo los enlaces actuales a términos y al producto. La verificación comprobará que `/privacy` compila, contiene todas las secciones acordadas y no declara proveedores no implementados.

## Decisiones descartadas

- Parche mínimo: no cubre de forma suficiente derechos, retención, IA y transferencias.
- Aviso de cookies separado: se pospone hasta que exista una integración de analítica o marketing que lo justifique.

