# Diseño: endurecimiento de seguridad

## Rate limiting compartido

Una tabla Prisma `RateLimitBucket` almacenará clave, contador y expiración. El store realizará una actualización atómica por clave y ventana en la base compartida; reemplaza el `Map` de proceso sin introducir Redis.

## Salidas y archivos

La exportación CSV prefijará con apóstrofo valores que comiencen por `=`, `+`, `-` o `@`. Los archivos privados usarán `X-Content-Type-Options: nosniff` y `Content-Disposition: attachment`; PDF nunca se renderiza inline.

## HTTP y entrada

`next.config.ts` definirá CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` y `X-Content-Type-Options`. Los esquemas Zod limitarán longitudes por campo y aceptarán únicamente datetime-local ISO válido para fechas.

## Pruebas

Se probarán ventanas compartidas, neutralización CSV, validación de longitud/datetime, headers y descarga privada.
