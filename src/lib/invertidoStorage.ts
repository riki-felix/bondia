import { parseMoneyInput, round2 } from "./moneyCalc";

/** Importe nuevo invertido en ese ejercicio (no el acumulado). */
export type InvertidoByYear = Record<string, number>;

export const INVERTIDO_BY_YEAR_KEY = "bondia_invertido_by_year";
export const INVERTIDO_LEGACY_KEY = "bondia_invertido";

/** Solo para migración única desde localStorage → BD. */
export function readInvertidoByYearFromLocal(): InvertidoByYear {
  if (typeof window === "undefined") return {};

  const raw = localStorage.getItem(INVERTIDO_BY_YEAR_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const out: InvertidoByYear = {};
        for (const [year, value] of Object.entries(parsed)) {
          const n = Number(value);
          if (Number.isFinite(n) && n > 0) out[year] = round2(n);
        }
        if (Object.keys(out).length > 0) return out;
      }
    } catch {
      /* legacy */
    }
  }

  const legacy = localStorage.getItem(INVERTIDO_LEGACY_KEY);
  if (legacy != null) {
    const n = parseMoneyInput(legacy);
    if (n != null && n > 0) {
      return { [String(new Date().getFullYear())]: round2(n) };
    }
  }

  return {};
}

export function clearInvertidoLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(INVERTIDO_BY_YEAR_KEY);
  localStorage.removeItem(INVERTIDO_LEGACY_KEY);
}

/** Suma incremental hasta el ejercicio de la vista (balance acumulado). */
export function invertidoBalanceForView(
  byYear: InvertidoByYear,
  yearFilter: string
): number {
  const entries = Object.entries(byYear)
    .map(([year, amount]) => [Number(year), amount] as const)
    .filter(([year, amount]) => Number.isFinite(year) && amount > 0)
    .sort(([a], [b]) => a - b);

  if (entries.length === 0) return 0;

  if (yearFilter === "all") {
    return round2(entries.reduce((sum, [, amount]) => sum + amount, 0));
  }

  const target = Number(yearFilter);
  if (!Number.isFinite(target)) return 0;

  return round2(
    entries
      .filter(([year]) => year <= target)
      .reduce((sum, [, amount]) => sum + amount, 0)
  );
}

/** Acumulado a cierre de un ejercicio concreto. */
export function invertidoBalanceAtYear(
  byYear: InvertidoByYear,
  year: number
): number {
  return invertidoBalanceForView(byYear, String(year));
}

export function invertidoViewLabel(yearFilter: string): string {
  if (yearFilter === "all") return "Acumulado total";
  return `Acumulado a ${yearFilter}`;
}
