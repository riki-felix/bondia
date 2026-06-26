import type { Property } from "./propertyTypes";
import { calcRetencion, round2, toNum } from "./moneyCalc";
import { effectiveIngresoBancoPropiedad } from "./ingresosBancoAggregate";
import { propertyIsLiquidada } from "./fetchInversionesWithLiquidaciones";

export interface InversionDisplayMoney {
  aportacion: number;
  retribucion: number;
  retencion: number;
  ingresoBanco: number;
  efectivo: number;
  jasp: number;
}

/** Importes mostrados en la tabla de inversiones (alineados con fila de totales). */
export function inversionDisplayMoney(row: Property): InversionDisplayMoney {
  const isLiquidada = propertyIsLiquidada(row);
  const retribucion = toNum(
    isLiquidada && row.liq ? row.liq.retribucion : row.retribucion
  );

  return {
    aportacion: toNum(
      isLiquidada && row.liq ? row.liq.aportacion : row.aportacion
    ),
    retribucion,
    retencion: toNum(
      isLiquidada && row.liq ? row.liq.retencion : calcRetencion(retribucion)
    ),
    ingresoBanco: effectiveIngresoBancoPropiedad({
      ingreso_banco: row.ingreso_banco,
      liqTransferencia: row.liq?.transferencia ?? null,
    }),
    efectivo: toNum(isLiquidada && row.liq ? row.liq.efectivo : row.efectivo),
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
