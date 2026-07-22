# Plantillas de correo con identidad StakeControl

## Objetivo

Reemplazar el HTML mínimo de los correos transaccionales por plantillas reutilizables que reflejen la identidad de StakeControl y funcionen de forma fiable en clientes de correo.

## Dirección visual

Se usará una versión clara de la marca: fondo claro legible, encabezado azul petróleo oscuro, logo de StakeControl, detalle de grilla sutil y un botón de acento. No se usará un correo completamente oscuro para evitar que Gmail, Outlook y otros clientes modifiquen o reduzcan el contraste.

## Componentes

- Contenedor centrado de ancho máximo 600px, con tipografía de sistema y estilos inline compatibles.
- Encabezado oscuro con el logo horizontal existente de StakeControl.
- Cuerpo blanco con un título, mensaje breve y un único CTA por correo.
- Botón de alto contraste con URL visible en el texto alternativo.
- Pie con remitente, nota de seguridad y referencia a la app; los correos de recuperación explican la expiración de una hora.

## Variantes

- Recuperación: título claro, CTA “Restablecer contraseña” y aviso de ignorar el mensaje si no fue solicitado.
- Bienvenida: confirma la cuenta y CTA hacia el dashboard/configuración.
- Alertas preventivas: preserva título y texto de la alerta, con CTA “Ver alertas”.

## Restricciones

- No incluir datos de apuestas ni información sensible innecesaria.
- Escapar todo valor dinámico antes de renderizar HTML.
- Mantener la versión de texto plano de cada correo.
- La estructura visual no puede alterar deduplicación, preferencias ni manejo de fallos de Resend.

## Pruebas

- Cada variante contiene el encabezado de marca, CTA correcto y texto plano equivalente.
- URLs y contenido dinámico se escapan en HTML.
- Las pruebas actuales de entrega siguen validando aislamiento ante fallos del proveedor y del historial.
