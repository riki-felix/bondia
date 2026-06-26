// src/lib/money.ts
// Formato español: miles con punto, decimales con coma, siempre 2 céntimos al mostrar.

const ES_MONEY_OPTS = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always" as const,
};

const ES_MONEY = new Intl.NumberFormat("es-ES", ES_MONEY_OPTS);

const ES_MONEY_CURRENCY = new Intl.NumberFormat("es-ES", {
  ...ES_MONEY_OPTS,
  style: "currency",
  currency: "EUR",
});

/** Redondeo a céntimos (alineado con ROUND(..., 2) en PostgreSQL NUMERIC) */
export function roundMoney2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const n = value >= 0 ? value + 1e-9 : value - 1e-9;
  return Math.round(n * 100) / 100;
}

/** Alias de roundMoney2 (uso habitual en cálculos) */
export const round2 = roundMoney2;

function canonicalDecimalString(s: string): string {
  if (s.includes(",")) {
    if (s.includes(".")) {
      s = s.replace(/\./g, "");
    }
    const last = s.lastIndexOf(",");
    const intPart = s.slice(0, last).replace(/,/g, "");
    const decPart = s.slice(last + 1);
    return intPart + (decPart ? `.${decPart}` : "");
  }

  const dotCount = (s.match(/\./g) || []).length;
  if (dotCount === 0) return s;
  if (dotCount === 1) {
    const last = s.lastIndexOf(".");
    const decPart = s.slice(last + 1);
    if (/^\d{1,2}$/.test(decPart)) return s;
    return s.replace(/\./g, "");
  }

  const last = s.lastIndexOf(".");
  const decPart = s.slice(last + 1);
  if (/^\d{1,2}$/.test(decPart)) {
    const intPart = s.slice(0, last).replace(/\./g, "");
    return `${intPart}.${decPart}`;
  }
  return s.replace(/\./g, "");
}

// Parser robusto: cualquier formato pegado → número
export function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  let negative = false;

  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }

  s = s
    .replace(/\s+/g, "")
    .replace(/[€$£]/g, "")
    .replace(/[^0-9,.\-]/g, "");

  if (!s || s === "-" || s === ".") return 0;

  s = canonicalDecimalString(s);
  const n = Number(s);
  return Number.isFinite(n) ? (negative ? -n : n) : 0;
}

function isEmptyMoney(value: number | string | null | undefined): boolean {
  return value === null || value === undefined || value === "";
}

/** Mostrar dinero con símbolo € — siempre 2 decimales (1.000.000,05 €) */
export function formatEuro(value: number | string | null | undefined): string {
  if (isEmptyMoney(value)) return "—";
  const n = roundMoney2(toNum(value));
  return ES_MONEY_CURRENCY.format(n);
}

/** Mostrar dinero sin símbolo — siempre 2 decimales (1.000.000,05) */
export function formatEuroPlain(
  value: number | string | null | undefined
): string {
  if (isEmptyMoney(value)) return "—";
  const n = roundMoney2(toNum(value));
  return ES_MONEY.format(n);
}

/** Valor normalizado para input de edición inline (vacío si no hay dato) */
export function formatMoneyEdit(value: unknown): string {
  if (value == null || value === "") return "";
  const n = roundMoney2(toNum(value));
  return ES_MONEY.format(n);
}

/** Texto pegado o escrito → número redondeado a 2 decimales; null si vacío */
export function parseMoneyInput(
  value: string | null | undefined
): number | null {
  if (value == null || value.trim() === "") return null;
  const n = toNum(value);
  if (!Number.isFinite(n)) return null;
  return roundMoney2(n);
}

/** @deprecated usar parseMoneyInput */
export function parseEuro(value: string | null | undefined): number | null {
  return parseMoneyInput(value);
}

/** Re-formatea texto monetario al modelo español (p. ej. tras pegar 1000000.05) */
export function normalizeMoneyText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = parseMoneyInput(trimmed);
  if (parsed === null) return trimmed;
  return formatMoneyEdit(parsed);
}

/** Valor numérico → texto para input de formulario (vacío si no hay dato) */
export function moneyFieldFromNumber(
  value: number | null | undefined
): string {
  if (value == null) return "";
  return formatMoneyEdit(value);
}

/** Texto de input → número redondeado a 2 decimales; null si vacío o inválido */
export function moneyFieldToNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return parseMoneyInput(normalizeMoneyText(trimmed));
}
