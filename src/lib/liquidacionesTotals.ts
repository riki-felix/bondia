import { deriveBrutoFromRetribucion, deriveSettlementMoney } from "./syncPropiedadFromLiquidaciones";
import { round2, toNum } from "./moneyCalc";

export interface LiquidacionesTotals {
  aportacion: number;
  beneficio_bruto: number;
  retribucion: number;
  retencion: number;
  neto: number;
  efectivo: number;
  transferencia: number;
}

export interface LiquidacionTotalsRow {
  aportacion: number;
  retribucion: number;
  transferencia: number;
  propiedad_participacion_sanyus?: number | null;
}

/** Totales de la cabecera = suma de los valores mostrados en cada fila. */
export function sumLiquidacionesTotals(
  rows: LiquidacionTotalsRow[]
): LiquidacionesTotals {
  const acc: LiquidacionesTotals = {
    aportacion: 0,
    beneficio_bruto: 0,
    retribucion: 0,
    retencion: 0,
    neto: 0,
    efectivo: 0,
    transferencia: 0,
  };

  for (const row of rows) {
    acc.beneficio_bruto += deriveBrutoFromRetribucion(row);
    acc.aportacion += toNum(row.aportacion);
    const derived = deriveSettlementMoney(row);
    acc.retribucion += derived.retribucion;
    acc.retencion += derived.retencion;
    acc.neto += derived.neto;
    acc.efectivo += derived.efectivo;
    acc.transferencia += toNum(row.transferencia);
  }

  return {
    aportacion: round2(acc.aportacion),
    beneficio_bruto: round2(acc.beneficio_bruto),
    retribucion: round2(acc.retribucion),
    retencion: round2(acc.retencion),
    neto: round2(acc.neto),
    efectivo: round2(acc.efectivo),
    transferencia: round2(acc.transferencia),
  };
}
