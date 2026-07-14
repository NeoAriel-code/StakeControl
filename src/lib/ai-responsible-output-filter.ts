const FORBIDDEN_OUTPUT_PHRASES = [
  "apuesta en este mercado",
  "este mercado es seguro",
  "aquí ganarás más",
  "aqui ganaras mas",
  "sube tu stake",
  "aumenta tu stake",
  "duplica tu stake",
  "recupera pérdidas",
  "recupera perdidas",
  "vas a ganar",
  "ganarás seguro",
  "ganaras seguro",
  "predicción",
  "prediccion",
  "apuesta recomendada",
  "mercado recomendado",
];

function normalizeText(value: string) {
  return value.toLocaleLowerCase("es-CL");
}

export function assertResponsibleAnalysisOutput(value: unknown) {
  const serialized = normalizeText(JSON.stringify(value));
  const blockedPhrase = FORBIDDEN_OUTPUT_PHRASES.find((phrase) =>
    serialized.includes(normalizeText(phrase))
  );

  if (blockedPhrase) {
    throw new Error(`El análisis IA contiene lenguaje prohibido: ${blockedPhrase}`);
  }
}
