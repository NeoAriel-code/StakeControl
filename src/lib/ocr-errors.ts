export class OcrProcessingError extends Error {
  constructor() {
    super("No se pudo procesar el ticket. Inténtalo de nuevo o completa los datos manualmente.");
    this.name = "OcrProcessingError";
  }
}
