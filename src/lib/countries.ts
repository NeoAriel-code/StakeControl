import { isSupportedCurrency, type CurrencyCode } from "@/lib/currencies";

export const COUNTRY_OPTIONS = [
  { code: "CL", name: "Chile", currency: "CLP", timezone: "America/Santiago" },
  { code: "US", name: "Estados Unidos", currency: "USD", timezone: "UTC" },
  { code: "AR", name: "Argentina", currency: "ARS", timezone: "America/Argentina/Buenos_Aires" },
  { code: "MX", name: "México", currency: "MXN", timezone: "America/Mexico_City" },
  { code: "CO", name: "Colombia", currency: "COP", timezone: "America/Bogota" },
  { code: "PE", name: "Perú", currency: "PEN", timezone: "America/Lima" },
  { code: "ES", name: "España", currency: "EUR", timezone: "UTC" },
  { code: "VE", name: "Venezuela", currency: "VES", timezone: "UTC" },
  { code: "UY", name: "Uruguay", currency: "UYU", timezone: "UTC" },
  { code: "BR", name: "Brasil", currency: "BRL", timezone: "UTC" },
  { code: "OTHER", name: "Otro país", currency: "USD", timezone: "UTC" },
] as const;

export const COUNTRY_CODES = COUNTRY_OPTIONS.map((country) => country.code) as [
  (typeof COUNTRY_OPTIONS)[number]["code"],
  ...(typeof COUNTRY_OPTIONS)[number]["code"][],
];

export type CountryCode = (typeof COUNTRY_CODES)[number];

export function getCountryRegistrationDefaults(countryCode: string): {
  countryCode: CountryCode;
  currency: CurrencyCode;
  timezone: string;
} {
  const country = COUNTRY_OPTIONS.find((option) => option.code === countryCode) ?? COUNTRY_OPTIONS.at(-1)!;
  const currency = isSupportedCurrency(country.currency) ? country.currency : "USD";

  return {
    countryCode: country.code,
    currency,
    timezone: country.timezone,
  };
}

export function getCountryName(countryCode: string | null | undefined) {
  return COUNTRY_OPTIONS.find((country) => country.code === countryCode)?.name ?? "No definido";
}

