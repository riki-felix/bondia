import { round2 } from "./moneyCalc";

export const OBJETIVO_BENEFICIO_MEDIO_OPERACION = "beneficio_medio_operacion" as const;

export type ObjetivoId = typeof OBJETIVO_BENEFICIO_MEDIO_OPERACION;

export interface Objetivo {
  id: ObjetivoId | string;
  etiqueta: string;
  valor: number | null;
}

export type ObjetivoProgressTone = "red" | "yellow" | "green" | "muted";

export interface ObjetivoProgress {
  percent: number;
  tone: ObjetivoProgressTone;
}

/** Progreso hacia el objetivo (máx. 100 %). */
export function computeObjetivoProgress(
  actual: number | null,
  target: number | null
): ObjetivoProgress {
  if (target == null || target <= 0 || actual == null) {
    return { percent: 0, tone: "muted" };
  }

  const a = round2(actual);
  const t = round2(target);

  if (a >= t) {
    return { percent: 100, tone: a > t ? "green" : "yellow" };
  }

  return {
    percent: round2(Math.min(100, (a / t) * 100)),
    tone: "red",
  };
}

export function objetivoValorFromRow(
  rows: Objetivo[],
  id: ObjetivoId
): number | null {
  const row = rows.find((o) => o.id === id);
  if (row?.valor == null) return null;
  const n = Number(row.valor);
  return Number.isFinite(n) ? round2(n) : null;
}
