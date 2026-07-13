export function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 8,
    }).format(value)}`;
  }
}

