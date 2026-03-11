// src/lib/moneyCalc.ts
// Decimal-safe calculation helpers for financial data.
// All functions round to 2 decimal places to match DECIMAL(12,2) in PostgreSQL.

export { toNum, formatEuro, formatEuroPlain, parseEuro } from "./money";

/** Round to 2 decimal places (banker's rounding avoided — standard rounding) */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Retención = retribución × 19% */
export function calcRetencion(retribucion: number): number {
  return round2(retribucion * 0.19);
}

/** Efectivo = retribución − retención − ingreso_banco */
export function calcEfectivo(
  retribucion: number,
  retencion: number,
  ingresoBanco: number
): number {
  return round2(retribucion - retencion - ingresoBanco);
}

/** JASP 20% = ingreso_banco × 20% */
export function calcJasp(ingresoBanco: number): number {
  return round2(ingresoBanco * 0.20);
}

/** Neto = retribución − retención */
export function calcNeto(retribucion: number, retencion: number): number {
  return round2(retribucion - retencion);
}

/** Efectivo (cash) = neto − transferencia (bank transfer) */
export function calcEfectivoFromTransfer(neto: number, transferencia: number): number {
  return round2(neto - transferencia);
}

/** Recalculate all derived fields from user-editable inputs */
export function recalcProperty(row: {
  retribucion: number;
  ingreso_banco: number;
}) {
  const retencion = calcRetencion(row.retribucion);
  const efectivo = calcEfectivo(row.retribucion, retencion, row.ingreso_banco);
  const jasp_10_percent = calcJasp(row.ingreso_banco);
  return { retencion, efectivo, jasp_10_percent };
}

/** Sum an array of numbers (for totals row) */
export function sumColumn(rows: Record<string, unknown>[], field: string): number {
  return round2(
    rows.reduce((acc, row) => {
      const val = row[field];
      return acc + (typeof val === "number" ? val : 0);
    }, 0)
  );
}
