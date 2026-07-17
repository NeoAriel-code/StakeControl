export function getTicketFilePresentation(mimeType: string | null | undefined) {
  return mimeType === "application/pdf" ? "download" : "image";
}
