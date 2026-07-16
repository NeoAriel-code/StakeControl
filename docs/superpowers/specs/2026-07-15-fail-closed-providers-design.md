# Diseño: proveedores fail-closed

## Objetivo

Cerrar rutas de configuración y procesamiento que puedan sustituir servicios reales por datos ficticios o almacenamiento local en producción. Google Cloud Vision, la API de OpenAI y Supabase Storage ya están implementados y funcionando; esta etapa conserva esas integraciones y solo endurece su configuración y manejo de errores.

## Configuración de seguridad

`AUTH_SECRET` será obligatorio en todos los entornos. No habrá secreto integrado ni valor alternativo.

La resolución de OCR, IA y almacenamiento será explícita. En producción se rechazará la configuración `mock` para OCR o IA y `local` para almacenamiento. También se rechazará un valor de proveedor desconocido o credenciales incompletas que, hasta ahora, inducían un fallback. Fuera de producción, los proveedores mock y el almacenamiento local solo podrán utilizarse cuando estén seleccionados de manera explícita para desarrollo o pruebas.

La validación se ubicará junto a cada fábrica/configuración de proveedor, para que no dependa exclusivamente de la acción de carga y proteja usos futuros de los servicios.

## OCR y errores seguros

Se introducirá un error de dominio `OcrProcessingError` con un mensaje apto para usuarios y sin detalles de credenciales, rutas internas ni respuestas del proveedor.

`GoogleVisionOcrProvider` no instanciará ni invocará `MockOcrProvider`. Si el archivo no es una imagen admitida, Vision no devuelve texto o la llamada falla, lanzará `OcrProcessingError`. La acción de carga interceptará ese error, devolverá su mensaje seguro y no guardará una extracción de OCR ficticia. Si el archivo ya fue almacenado antes del error, se eliminará como compensación para evitar objetos huérfanos.

## Archivos admitidos

La carga de tickets se limitará temporalmente a JPG, PNG y WEBP. Se retirará PDF de la validación MIME, extensiones, firmas, texto de ayuda y controles de interfaz. No se persistirá ni enviará PDF a OCR hasta que una etapa posterior implemente una conversión real, controlada y verificable a imagen.

## Pruebas

Las pruebas cubrirán que:

- La ausencia de `AUTH_SECRET` produce un error explícito.
- Producción rechaza OCR mock/local, IA mock y storage local o incompleto, mientras conserva las selecciones reales configuradas.
- Google Vision convierte errores, respuestas vacías y formatos no admitidos en `OcrProcessingError`, sin texto mock.
- La validación de carga rechaza PDF y conserva JPG, PNG y WEBP.
- La acción de carga devuelve el mensaje OCR seguro y limpia el objeto almacenado si falla el OCR.

## Límites

No se modifica la implementación funcional de Google Vision, OpenAI/ChatGPT API o Supabase Storage cuando su configuración válida está presente. No se implementa conversión de PDF en esta etapa.
