# Operación de extracción alternativa de tickets (archivada)

> DeepSeek está completamente deshabilitado durante la beta cerrada. La configuración rechaza su activación y la ruta de ejecución devuelve siempre `disabled`. El contenido siguiente se conserva únicamente como historial técnico y no autoriza su uso.

## Riesgo aceptado

StakeControl acepta usar los términos públicos del procesador de IA alojado en China sin DPA ni confirmación escrita. Sus términos y política pública contemplan el uso de inputs para mejorar tecnología y dejan a StakeControl como responsable frente al usuario. Esta aceptación cubre únicamente extracción estructurada de tickets con datos seudonimizados mínimos; nunca análisis de juego responsable.

El control compensatorio es técnico: privacy gate, OpenAI como fallback, revisión humana, circuito, límite de costo y kill switch dinámico. Una suspensión contractual o indisponibilidad se recupera llevando `enabled=false` o el rollout a `0`; no se eliminan tickets ni extracciones.

## Configuración

- `DEEPSEEK_API_KEY`: secreto server-side.
- `AI_TICKET_PRIMARY_PROVIDER=deepseek`.
- `AI_TICKET_FALLBACK_PROVIDER=openai`.
- `AI_TICKET_DEEPSEEK_TIMEOUT_MS`: timeout por intento; el presupuesto agregado sigue limitado a 20 segundos.
- `AI_TICKET_OPENAI_FALLBACK_LIMIT_PER_MINUTE`: reserva global máxima del fallback.
- `OPENAI_API_KEY`: requerido para la ruta de fallback productiva.

La migración crea DeepSeek apagado y en 0 %. El panel de administración modifica configuración persistida; los workflows la releen inmediatamente antes de una llamada.

## Rollout y rollback

Avanzar 1 % → 5 % → 25 % → 50 % → 100 %. Exigir respectivamente 24 h/1.000, 24 h/5.000, 48 h/20.000 y 72 h/50.000, tomando el periodo o muestra que termine más tarde. Detener ante degradación de calidad, privacidad, latencia, costo, fallback o disponibilidad. El rollback es rollout 0 % o kill switch apagado.

## Puertas de calidad

Antes de cada etapa: suite completa, lint, TypeScript, build, migración temporal y auditoría de dependencias. Comparar un corpus versionado de 1.000 tickets (500 sintéticos y 500 reales seudonimizados) y exigir JSON DeepSeek ≥99,5 %, resultado combinado ≥99,9 %, fallback <3 %, revisión manual +≤1 punto porcentual, degradación por campo ≤0,5 puntos y reducción de costo ≥60 %.

Validar cuota/saldo/región en Google Vision, Vercel Workflow, OpenAI y DeepSeek. Ejecutar carga con 1.000 workflows: inicio p95 <500 ms, cola p95 <5 s, total p95 <30 s/p99 <60 s, error final <1 %, cero duplicados y cero rechazos de conexión.

## Observabilidad

Alertar backlog, duración, error por proveedor, circuito abierto, fallback, revisión manual, tokens, costo, 401/402/429/5xx y capacidad restante. Los spans sólo incluyen tarea, proveedor, modelo, resultado, fallback, latencia y tokens. Nunca incluir OCR, prompts, outputs, códigos, importes, selecciones, IDs de usuario ni mensajes originales del proveedor.

Revisar semanalmente durante el primer mes y luego mensualmente: precios vigentes, factura exportada, términos, política de datos, precisión por casa y capacidad. Las tarifas no se fijan como constantes en código.
