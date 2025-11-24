// src/lib/money.ts

// Parser robusto reutilizable: cualquier cosa → número
export function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  let s = String(v).trim();
  let negative = false;

  // Formato contable: (123,45)
  if (s.startsWith("(") && s.endsWith(")")) {
	negative = true;
	s = s.slice(1, -1);
  }

  s = s
	.replace(/\s+/g, "")       // espacios
	.replace(/[€$£]/g, "")     // símbolos de moneda
	.replace(/[^0-9,.\-]/g, ""); // otros caracteres raros

  // Combinaciones de . y ,
  if (s.includes(",") && s.includes(".")) {
	// "10.000,50" → "10000.50"
	s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",") && !s.includes(".")) {
	// "1000,5" → "1000.5"
	s = s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? (negative ? -n : n) : 0;
}

// 1. Mostrar dinero con símbolo €
// - 64980     → "64.980 €"
// - 64980.00  → "64.980 €"
// - 64980.5   → "64.980,50 €"
export function formatEuro(value: number | string | null | undefined): string {
  const n = toNum(value);
  if (!isFinite(n) || n === 0 && (value === null || value === undefined || value === "")) {
	return "—";
  }

  const cents = Math.round(n * 100) % 100;
  const hasDecimals = cents !== 0;

  return new Intl.NumberFormat("es-ES", {
	style: "currency",
	currency: "EUR",
	minimumFractionDigits: hasDecimals ? 2 : 0,
	maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(n);
}

// 2. Mostrar dinero SIN símbolo, pero con miles y coma decimal
// - 64980     → "64.980"
// - 64980.00  → "64.980"
// - 64980.5   → "64.980,50"
export function formatEuroPlain(
  value: number | string | null | undefined
): string {
  const n = toNum(value);
  if (!isFinite(n) || n === 0 && (value === null || value === undefined || value === "")) {
	return "—";
  }

  const cents = Math.round(n * 100) % 100;
  const hasDecimals = cents !== 0;

  return new Intl.NumberFormat("es-ES", {
	minimumFractionDigits: hasDecimals ? 2 : 0,
	maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(n);
}

// 3. Parsear "10.000,50" → 10000.5 (útil en inputs)
export function parseEuro(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = toNum(value);
  return isFinite(n) ? n : null;
}