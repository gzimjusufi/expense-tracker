export const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  MKD: "ден",
  CHF: "CHF",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
};

export const formatCurrency = (amount, currency = "USD") => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};