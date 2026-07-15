# Corrección de efectos React — diseño

## Objetivo

Eliminar los dos errores de lint `react-hooks/set-state-in-effect` sin cambiar el comportamiento visible de la actualización rápida de resultados ni del panel de alertas.

## Alcance

- `src/components/bets/QuickBetResultSelect.tsx`
- `src/components/layout/Navbar.tsx`
- Pruebas de regresión focalizadas para los comportamientos extraídos o modificados.

No se modificarán rutas API, acciones de servidor, datos de apuestas ni el diseño visual de los componentes.

## QuickBetResultSelect

El componente conservará el resultado elegido de forma optimista cuando el usuario seleccione una opción. El resultado recibido desde el servidor seguirá siendo la fuente de verdad cuando cambie. Se eliminará el `useEffect` que copia la prop `result` al estado y se adoptará un mecanismo de estado optimista compatible con React 19, de modo que no exista una actualización de estado sincrónica dentro de un efecto.

## Navbar

El panel de alertas cargará sus alertas al abrirse desde el manejador del botón que cambia su estado. Se eliminará el efecto dedicado a observar `alertsOpen`; la carga, el indicador de carga y la actualización de alertas continuarán ocurriendo para la misma interacción del usuario.

El efecto de montaje que obtiene el contador inicial se mantiene, pues su actualización ocurre tras la resolución asíncrona de la solicitud y no genera el aviso actual.

## Pruebas y verificación

Las pruebas cubrirán que el resultado elegido se muestra de forma optimista y que el flujo de apertura inicia la carga de alertas. Se verificará el lint de ambos archivos, la suite completa, TypeScript y el lint completo. La corrección se considerará lista solo si `npm run lint` termina sin errores.

## Riesgos y mitigación

- Riesgo: que el resultado optimista no se restablezca cuando el servidor entregue una nueva prop. Mitigación: usar el valor de la prop como estado base del mecanismo optimista.
- Riesgo: que abrir el menú deje de solicitar alertas. Mitigación: encapsular la apertura y la carga en el mismo manejador y cubrirlo con prueba.

