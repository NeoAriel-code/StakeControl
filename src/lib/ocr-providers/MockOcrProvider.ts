import type { OcrProvider } from "@/lib/ocr-service";

export class MockOcrProvider implements OcrProvider {
  async extractText(fileUrl: string): Promise<string> {
    return [
      "Sportsbook: Betano",
      "Evento: Flamengo vs Palmeiras",
      "Deporte: Futbol",
      "Liga: Brasileirao Serie A",
      "Mercado: Ganador del partido",
      "Seleccion: Flamengo",
      "Tipo: SINGLE",
      "Stake: 15000 CLP",
      "Cuota: 2.35",
      "Posible retorno: 35250 CLP",
      "Fecha: 2026-07-10T12:29",
      "Codigo ticket: MOCK-" + fileUrl.slice(-8).replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
    ].join("\n");
  }
}
