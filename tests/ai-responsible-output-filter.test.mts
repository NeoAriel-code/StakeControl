import test from "node:test";
import assert from "node:assert/strict";
import { assertResponsibleAnalysisOutput } from "../src/lib/ai-responsible-output-filter";

test("assertResponsibleAnalysisOutput allows preventive historical language", () => {
  assert.doesNotThrow(() =>
    assertResponsibleAnalysisOutput({
      summary:
        "En tus datos históricos esto puede estar influido por muestra pequeña o varianza.",
      messages: [
        "No se recomienda aumentar el stake automáticamente.",
        "Considera revisar tus límites.",
        "Podrías reducir exposición o pausar temporalmente.",
      ],
    })
  );
});

test("assertResponsibleAnalysisOutput blocks prohibited betting recommendations", () => {
  assert.throws(
    () =>
      assertResponsibleAnalysisOutput({
        summary: "Sube tu stake.",
      }),
    /lenguaje prohibido/
  );
});

test("assertResponsibleAnalysisOutput blocks predictions and profit promises", () => {
  assert.throws(
    () => assertResponsibleAnalysisOutput({ summary: "Con esta selección vas a ganar." }),
    /lenguaje prohibido/
  );
});
