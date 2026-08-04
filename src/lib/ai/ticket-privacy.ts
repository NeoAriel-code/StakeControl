const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const RUT = /\b\d{1,2}[.]?\d{3}[.]?\d{3}-[0-9Kk]\b/g;
const LABELED_PHONE = /\b(?:tel(?:e[fóo]no)?|m[oó]vil|celular|whatsapp)\s*[:#-]?\s*(?:\+?\d[\d ()-]{7,}\d)/gi;
const INTERNATIONAL_PHONE = /\+\d{1,3}[ ()-]?\d[\d ()-]{7,}\d/g;
const HIGH_ENTROPY_TOKEN = /\b(?=[A-Za-z0-9_-]{20,}\b)(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]+\b/g;
const LABELED_SECRET = /\b(?:usuario|user|cuenta|account|cliente|customer|sesi[oó]n|session)(?:[_\s]*(?:id|n[úu]mero|nro|#))?\s*[:=-]\s*[^\s,;]+/gi;
const NAME_LINE = /^\s*(?:nombre|titular|apostador|cliente)\s*:\s*.+$/gim;
const ADDRESS_LINE = /^\s*(?:direcci[oó]n|domicilio|calle)\s*:\s*.+$/gim;
const CODE_LINE = /^\s*(?:c[oó]digo\s+(?:de\s+)?(?:ticket|recibo|apuesta)|ticket(?=\s*[:#-])|ticket\s*(?:id|n[úu]mero|nro|#)|receipt|comprobante|barcode|c[oó]digo\s+de\s+barras|qr)\s*[:#-]?\s*(.+)$/gim;
const UNKNOWN_IDENTIFIER = /\b(?:pasaporte|passport|documento\s+de\s+identidad|national\s+id|dni|cpf)\b/i;
const PROMPT_INJECTION = /\b(?:ignore|ignora|revela|reveal|system prompt|developer message|instrucciones del sistema)\b/i;

export type PrivacyGateResult = {
  text: string;
  safeForDeepSeek: boolean;
  reasons: string[];
  restoreTicketCode: (value: string | null | undefined) => string | null | undefined;
};

function uniquePlaceholder(prefix: string, index: number) {
  return `[${prefix}_${index + 1}]`;
}

export function sanitizeTicketOcr(rawText: string): PrivacyGateResult {
  const values = new Map<string, string>();
  const ticketCodes: string[] = [];
  let replacementIndex = 0;
  const store = (prefix: string, original: string) => {
    const placeholder = uniquePlaceholder(prefix, replacementIndex++);
    values.set(placeholder, original.trim());
    if (prefix === "TICKET_CODE") ticketCodes.push(original.trim());
    return placeholder;
  };
  const replace = (prefix: string) => (match: string) => store(prefix, match);
  const replaceCode = (match: string, captured: string) => `${match.slice(0, Math.max(0, match.length - captured.length))}${store("TICKET_CODE", captured)}`;

  let text = rawText.normalize("NFKC")
    .replace(CODE_LINE, replaceCode)
    .replace(EMAIL, replace("EMAIL"))
    .replace(RUT, replace("RUT"))
    .replace(LABELED_PHONE, replace("PHONE"))
    .replace(INTERNATIONAL_PHONE, replace("PHONE"))
    .replace(LABELED_SECRET, replace("IDENTIFIER"))
    .replace(NAME_LINE, replace("NAME"))
    .replace(ADDRESS_LINE, replace("ADDRESS"))
    .replace(HIGH_ENTROPY_TOKEN, replace("TOKEN"));

  const reasons: string[] = [];
  if (ticketCodes.length > 1) reasons.push("ambiguous_ticket_codes");
  if (UNKNOWN_IDENTIFIER.test(text)) reasons.push("unknown_identifier_pattern");
  if (EMAIL.test(text) || RUT.test(text) || LABELED_PHONE.test(text) || INTERNATIONAL_PHONE.test(text) || HIGH_ENTROPY_TOKEN.test(text)) {
    reasons.push("uncovered_identifier");
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !/^(?:t[eé]rminos|juego responsable|publicidad|promoci[oó]n|copyright)\b/i.test(line));
  text = lines.slice(0, 80).join("\n").slice(0, 8_000);
  if (lines.length > 80 || text.length >= 8_000) reasons.push("input_too_large");

  const restoreTicketCode = (value: string | null | undefined) => {
    if (!value || ticketCodes.length !== 1) return value;
    const restored = values.get(value.trim());
    return restored && restored === ticketCodes[0] ? restored : value;
  };

  return {
    text,
    safeForDeepSeek: reasons.length === 0,
    reasons,
    restoreTicketCode,
  };
}

export function containsPromptInjection(text: string) {
  return PROMPT_INJECTION.test(text);
}
