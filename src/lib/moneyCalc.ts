// src/lib/moneyCalc.ts
// Decimal-safe calculation helpers for financial data.
// All functions round to 2 decimal places to match DECIMAL(12,2) in PostgreSQL.

import { roundMoney2, toNum } from "./money";

const round2 = roundMoney2;

export {
  toNum,
  formatEuro,
  formatEuroPlain,
  formatMoneyEdit,
  moneyFieldFromNumber,
  moneyFieldToNumberOrNull,
  parseEuro,
  parseMoneyInput,
  normalizeMoneyText,
  roundMoney2,
  round2,
} from "./money";

/** Retención IRPF = 19% de retribución */
export function calcRetencion(retribucion: number): number {
  return round2(retribucion * 0.19);
}

/** Neto = retribución − retención */
export function calcNetoFromRetribucion(retribucion: number): number {
  return round2(retribucion - calcRetencion(retribucion));
}

/** Efectivo = retribución − retención − ingreso_banco */
export function calcEfectivo(
  retribucion: number,
  retencion: number,
  ingresoBanco: number
): number {
  return round2(retribucion - retencion - ingresoBanco);
}

/** Retribución = ROUND(bruto × % / 100, 2) — mismo criterio que la BD */
export function calcRetribucionFromBruto(
  bruto: number,
  pctSanyus: number
): number {
  return round2((bruto * pctSanyus) / 100);
}

/** Bruto = ROUND(retribución × 100 / % Sanyus, 2) — inversa de calcRetribucionFromBruto */
export function calcBrutoFromRetribucion(
  retribucion: number,
  pctSanyus: number
): number {
  if (pctSanyus <= 0) return 0;
  return round2((retribucion * 100) / pctSanyus);
}

/** JASP automático = bruto × % JASP de la ficha */
export function calcJaspAutoFromBruto(bruto: number, pctJasp: number): number {
  return round2(bruto * (pctJasp / 100));
}

/** Neto = retribución − retención (usa retención pasada o la recalcula desde retribución) */
export function calcNeto(retribucion: number, retencion?: number): number {
  return round2(retribucion - (retencion ?? calcRetencion(retribucion)));
}

/** Efectivo (cash) = neto − transferencia (bank transfer) */
export function calcEfectivoFromTransfer(neto: number, transferencia: number): number {
  return round2(neto - transferencia);
}

/** Recalcula retención y efectivo en propiedad (retribución ya viene de liquidaciones) */
export function recalcPropertyEfectivo(row: {
  retribucion: number;
  ingreso_banco: number;
}) {
  const retribucion = toNum(row.retribucion);
  const retencion = calcRetencion(retribucion);
  const efectivo = calcEfectivo(retribucion, retencion, row.ingreso_banco);
  return { retencion, efectivo };
}

/** Sum an array of numbers (for totals row) */
export function sumColumn(rows: Record<string, unknown>[], field: string): number {
  return round2(
    rows.reduce((acc, row) => acc + toNum(row[field]), 0)
  );
}
