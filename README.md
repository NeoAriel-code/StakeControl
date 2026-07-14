# StakeControl

StakeControl es un MVP web para apostadores deportivos que quieren registrar su actividad, revisar exposición histórica y mantener límites visibles. No entrega picks, predicciones ni recomendaciones de apuesta.

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

## OCR Local Con Tesseract

El MVP soporta OCR local experimental con Tesseract para probar tickets sin pagar proveedores cloud.

En Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng
```

En `.env`:

```env
OCR_PROVIDER="tesseract"
TESSERACT_BIN="tesseract"
TESSERACT_LANG="spa+eng"
```

Notas:

- Tesseract procesa localmente imagenes JPG, PNG y WEBP.
- Los PDF subidos usan fallback mock en este MVP.
- Si Tesseract no esta instalado o no puede leer la imagen, StakeControl mantiene el flujo usando mock y muestra una advertencia en el texto extraido.
- La revision humana sigue siendo obligatoria: el OCR es ayuda, no fuente final de verdad.

## Rutas Oficiales Del MVP

- `/`: landing publica.
- `/register`: registro.
- `/login`: inicio de sesion.
- `/onboarding`: setup inicial responsable.
- `/dashboard`: resumen principal.
- `/health`: salud de juego y datos demo.
- `/bets`: historial de apuestas.
- `/bets/new`: registro manual.
- `/tickets`: carga y revision de tickets con OCR mock.
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
- OCR mockeado,
- bloqueo premium/free,
- filtro de salida del analisis IA responsable,
- exportacion CSV.

## Limites Conocidos

- No hay pasarela de pago real.
- OCR local con Tesseract esta disponible como proveedor experimental; cloud OCR queda preparado a nivel arquitectura.
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
