export const CURRENCY_OPTIONS = [
  { value: "CLP", label: "CLP - Peso chileno" },
  { value: "USD", label: "USD - Dólar estadounidense" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "ARS", label: "ARS - Peso argentino" },
  { value: "MXN", label: "MXN - Peso mexicano" },
  { value: "COP", label: "COP - Peso colombiano" },
  { value: "PEN", label: "PEN - Sol peruano" },
  { value: "BTC", label: "BTC - Bitcoin" },
  { value: "ETH", label: "ETH - Ethereum" },
  { value: "USDT", label: "USDT - Tether" },
  { value: "USDC", label: "USDC - USD Coin" },
  { value: "BNB", label: "BNB - Binance Coin" },
  { value: "SOL", label: "SOL - Solana" },
] as const;

export const CURRENCY_CODES = CURRENCY_OPTIONS.map((option) => option.value) as [
  (typeof CURRENCY_OPTIONS)[number]["value"],
  ...(typeof CURRENCY_OPTIONS)[number]["value"][],
];

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return CURRENCY_CODES.includes(value as CurrencyCode);
}

