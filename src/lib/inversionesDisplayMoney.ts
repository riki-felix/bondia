import type { Property } from "./propertyTypes";
import { calcRetencion, round2, toNum } from "./moneyCalc";

export interface InversionDisplayMoney {
  aportacion: number;
  retribucion: number;
  retencion: number;
  ingresoBanco: number;
  efectivo: number;
  jasp: number;
}

/** Importes mostrados en la tabla de inversiones (propiedades = fuente unificada). */
export function inversionDisplayMoney(row: Property): InversionDisplayMoney {
  const retribucion = toNum(row.retribucion);

  return {
    aportacion: toNum(row.aportacion),
    retribucion,
    retencion: toNum(row.retencion ?? calcRetencion(retribucion)),
    ingresoBanco: toNum(row.ingreso_banco),
    efectivo: toNum(row.efectivo),
    jasp: toNum(row.jasp_10_percent),
  };
}

export function sumInversionDisplayMoney(
  rows: Property[]
): InversionDisplayMoney {
  const acc: InversionDisplayMoney = {
    aportacion: 0,
    retribucion: 0,
    retencion: 0,
    ingresoBanco: 0,
    efectivo: 0,
    jasp: 0,
  };

  for (const row of rows) {
    const d = inversionDisplayMoney(row);
    acc.aportacion += d.aportacion;
    acc.retribucion += d.retribucion;
    acc.retencion += d.retencion;
    acc.ingresoBanco += d.ingresoBanco;
    acc.efectivo += d.efectivo;
    acc.jasp += d.jasp;
  }

  return {
    aportacion: round2(acc.aportacion),
    retribucion: round2(acc.retribucion),
    retencion: round2(acc.retencion),
    ingresoBanco: round2(acc.ingresoBanco),
    efectivo: round2(acc.efectivo),
    jasp: round2(acc.jasp),
  };
}
