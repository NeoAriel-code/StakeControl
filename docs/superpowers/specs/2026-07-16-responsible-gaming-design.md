# Diseño: salud de juego preventiva

Health conserva su nombre y pasa a comunicar indicadores preventivos, no un diagnóstico ni un score clínico. Los niveles serán “Sin señales preventivas relevantes”, “Conviene revisar”, “Revisión prioritaria” y “Pausa activa”. Una pausa no penaliza el nivel.

Se eliminarán frases de certeza como “Actividad bajo control”. Los límites superados indicarán explícitamente que fueron superados. ROI usará siempre apuestas resueltas; el bloque de mejor desempeño solo aparecerá desde 20 apuestas.

Los períodos diario, semanal y mensual se calcularán desde la timezone guardada del usuario para límites, totales y alertas. Las pruebas cubrirán pausa neutral, niveles, ROI resuelto, umbral de muestra, mensaje de límite y límites de período por timezone.
