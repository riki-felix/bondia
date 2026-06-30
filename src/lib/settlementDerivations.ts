import {
  calcBrutoFromRetribucion,
  calcEfectivoFromTransfer,
  calcNeto,
  calcRetencion,
  round2,
} from "./moneyCalc";
import {
  effectiveParticipacionSanyus,
} from "./participacion";

export interface SettlementBrutoInput {
  retribucion: number;
  propiedad_participacion_sanyus?: number | null;
}

/** Bruto derivado de retribución y % Sanyus de la propiedad */
export function deriveBrutoFromRetribucion(row: SettlementBrutoInput): number {
  const retribucion = round2(Number(row.retribucion) || 0);
  if (retribucion <= 0) return 0;
  return calcBrutoFromRetribucion(
    retribucion,
    effectiveParticipacionSanyus(row.propiedad_participacion_sanyus)
  );
}

export interface SettlementMoneyDerived {
  retribucion: number;
  retencion: number;
  neto: number;
  efectivo: number;
}

/** Importes derivados desde retribución almacenada (retención, neto, efectivo) */
export function deriveSettlementMoney(row: {
  retribucion: number;
  transferencia: number;
}): SettlementMoneyDerived {
  const retribucion = round2(Number(row.retribucion) || 0);
  const transferencia = Number(row.transferencia) || 0;

  const retencion = calcRetencion(retribucion);
  const neto = calcNeto(retribucion);
  const efectivo = calcEfectivoFromTransfer(neto, transferencia);

  return {
    retribucion,
    retencion,
    neto,
    efectivo,
  };
}
