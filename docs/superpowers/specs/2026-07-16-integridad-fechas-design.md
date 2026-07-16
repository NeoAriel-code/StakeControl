# Diseño: integridad de fechas de apuestas

## Objetivo

Conservar solo fechas respaldadas por una fuente identificable durante el registro manual y la extracción de tickets. Una apuesta puede no tener fecha de colocación ni fecha de inicio del evento; la aplicación no sustituirá esos valores por la hora actual.

## Modelo de datos

`Bet.placedAt` pasará a ser nullable y se añadirá `Bet.eventStartAt` nullable. Se añadirán tres columnas de procedencia nullable: `placedAtSource`, `eventStartAtSource` y `currencySource`.

Las procedencias usarán un enum Prisma compartido:

- `USER`: la persona ingresó o corrigió el valor.
- `OCR`: el valor aparece de forma explícita en el ticket procesado.
- `INFERRED`: el valor proviene de contexto y no del ticket, como la moneda preferida del usuario.
- `UNKNOWN`: no existe una fuente fiable o el registro es anterior a esta funcionalidad.

La migración preservará los datos existentes. Las apuestas anteriores recibirán `UNKNOWN` como procedencia de los campos que ya tenían valor; los valores ausentes conservarán la procedencia `null`.

## Extracción y revisión

Los esquemas de extracción aceptarán `placedAt` y `eventStartAt` ausentes. El parser solo conservará una fecha cuando el OCR la incluya; los fallbacks y el parser mock no utilizarán `new Date()` para completar fechas. Las fechas ausentes se marcarán como dudosas para que la persona pueda revisarlas.

La moneda explícita del OCR recibirá `OCR`. La moneda tomada de las preferencias de la persona recibirá `INFERRED`. El formulario de revisión enviará los tres valores de procedencia originales y, si la persona introduce o modifica un campo, la acción de servidor persistirá `USER` para ese campo.

## Formularios

El formulario manual permitirá dejar vacías la fecha de colocación y la fecha de inicio del evento. Cualquier fecha o moneda elegida allí tendrá procedencia `USER`.

El formulario de revisión añadirá el inicio del evento junto a la fecha de colocación. Mantendrá el lenguaje visual actual: campos de fecha en la grilla de datos y una ayuda breve bajo cada campo marcado como automático o inferido. No se agregan adornos ni una jerarquía visual nueva; la distinción de procedencia sirve a la revisión humana sin competir con los datos del ticket.

## Compatibilidad de consultas

Las vistas, métricas y exportaciones que dependen de `placedAt` excluirán de sus cálculos o tratarán de forma explícita los registros sin fecha. Las pantallas de detalle y edición mostrarán una ausencia como “Sin fecha registrada”, sin intentar formatear `null`.

## Pruebas

Las pruebas cubrirán:

- Validación Zod de fechas opcionales y procedencias válidas.
- Extracción con fecha explícita (`OCR`) y sin fecha (`null`, sin fecha actual fabricada).
- Moneda explícita (`OCR`) y moneda tomada de preferencias (`INFERRED`).
- Revisión/formulario que conserva valores ausentes y asigna `USER` cuando la persona los proporciona.
- Migración Prisma con `placedAt` nullable, `eventStartAt` y las tres procedencias.

## Límites

Esta etapa no intenta inferir ni normalizar fechas de eventos a partir de texto ambiguo, ni modifica la fecha de liquidación automática (`settledAt`) asociada a una actualización de resultado.
