# StakeControl 🚀

StakeControl es una aplicación web y móvil para registrar, analizar y controlar la actividad de apuestas deportivas, ayudando a los usuarios a mantener presupuestos sanos, analizar rendimientos y prevenir conductas de riesgo en el juego.

## 🛡️ Principios Éticos y de Juego Responsable

Este proyecto se rige por reglas éticas estrictas:
1. **Sin Promesas de Ganancias:** No garantizamos retornos ni usamos lenguaje engañoso como "dinero seguro".
2. **Sin Recomendaciones de Apuestas:** No aconsejamos al usuario en qué eventos o cuotas apostar.
3. **No Recuperación de Pérdidas:** No se incentiva al usuario a recuperar lo perdido.
4. **Alertas de Riesgo:** Monitoreo activo de patrones de riesgo (persecución de pérdidas, apuestas impulsivas, superación de presupuestos) con avisos explícitos para pausar o autolimitarse.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript (Strict Mode)
- **Estilos:** Tailwind CSS v4 & shadcn/ui
- **Base de Datos:** PostgreSQL (con Prisma ORM)
- **Validación:** Zod
- **Gráficos:** Recharts

---

## 📁 Estructura del Proyecto

El proyecto está estructurado modularmente por características (features) para facilitar el escalado y mantenimiento:

```
├── prisma/                  # Configuración y Esquema de Prisma ORM
├── public/                  # Recursos estáticos
├── src/
│   ├── app/                 # Next.js App Router (Páginas y APIs globales)
│   ├── components/          # Componentes compartidos y UI básica
│   │   └── ui/              # Componentes de shadcn/ui
│   ├── features/            # Módulos específicos por dominio
│   │   ├── auth/            # Autenticación y Registro
│   │   ├── bets/            # Registro manual e historial de apuestas
│   │   ├── dashboard/       # Paneles generales e inicio
│   │   ├── limits/          # Gestión de presupuestos y límites de juego
│   │   ├── tickets/         # Carga de comprobantes y OCR
│   │   └── responsible-gaming/ # Lógica de detección de riesgo y alertas
│   ├── lib/                 # Utilidades globales y clientes (Prisma, etc.)
│   ├── server/              # Servicios de backend aislados y lógica del lado del servidor
│   ├── types/               # Tipados de TypeScript globales
│   └── middleware.ts        # Control de accesos y guards
```

---

## 🚀 Instalar y Ejecutar

### 1. Clonar e Instalar Dependencias

Para instalar todas las dependencias necesarias:
```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus variables locales:
```bash
cp .env.example .env
```

Variables relevantes para OCR:
```env
OCR_PROVIDER=mock
GOOGLE_VISION_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AZURE_VISION_ENDPOINT=
AZURE_VISION_KEY=
```

Proveedores soportados por arquitectura:
- `mock`
- `google_vision`
- `aws_textract`
- `azure_vision`

Para cambiar de proveedor no hace falta tocar la UI ni el flujo de tickets. Solo cambia `OCR_PROVIDER` en `.env`.
Mientras no integres credenciales reales, mantén `OCR_PROVIDER=mock`.

### 3. Ejecutar el Servidor de Desarrollo

Inicia el entorno de desarrollo local:
```bash
npm run dev
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

### 4. Cambiar proveedor OCR

El flujo actual usa un `MockOcrProvider` por defecto. La selección del proveedor se hace en tiempo de ejecución mediante `OCR_PROVIDER`.

Ejemplos:
```env
OCR_PROVIDER=mock
```

```env
OCR_PROVIDER=google_vision
```

```env
OCR_PROVIDER=aws_textract
```

```env
OCR_PROVIDER=azure_vision
```

Los providers reales están preparados como placeholders:
- [src/lib/ocr-providers/GoogleVisionOcrProvider.ts](/home/arielalfaro/proyecto-apuestas/src/lib/ocr-providers/GoogleVisionOcrProvider.ts:1)
- [src/lib/ocr-providers/AwsTextractOcrProvider.ts](/home/arielalfaro/proyecto-apuestas/src/lib/ocr-providers/AwsTextractOcrProvider.ts:1)
- [src/lib/ocr-providers/AzureVisionOcrProvider.ts](/home/arielalfaro/proyecto-apuestas/src/lib/ocr-providers/AzureVisionOcrProvider.ts:1)

Eso permite integrar credenciales y SDKs más adelante sin cambiar las pantallas, server actions ni el flujo de revisión humana.

---

## 🧪 Verificación de Calidad

Para ejecutar la suite automatizada:
```bash
npm test
```

La suite usa `node --test` con `tsx` y cubre:
- métricas críticas: ROI, win rate, profit/loss, stake promedio y rachas
- reglas de alertas: racha de pérdidas, aumento de stake, límites y pausa activa
- validaciones Zod de apuestas manuales y revisión OCR
- helpers de permisos por `userId`
- OCR mockeado y parser de tickets
- bloqueo premium/free para funciones avanzadas
- filtro de lenguaje responsable en análisis IA

Para validar el tipado de TypeScript y asegurar que no existen errores antes de hacer un commit:
```bash
npm run build
# o bien para verificar tipos
npx tsc --noEmit
```
