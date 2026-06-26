import type { Property } from "./propertyTypes";
import { round2 } from "./moneyCalc";
import { propertyIsLiquidada } from "./fetchInversionesWithLiquidaciones";
import { inversionDisplayMoney } from "./inversionesDisplayMoney";

export interface InversionesSummaryStats {
  aportacionTotal: number;
  beneficioNeto: number;
  beneficioBruto: number;
  retribucionTotal: number;
  beneficioMedio: number | null;
  operacionesLiquidadas: number;
}

function isDraft(row: Property): boolean {
  return row.estado === "borrador";
}

/** Métricas de cabecera a partir de la vista activa (sin búsqueda de texto). */
export function computeInversionesSummaryStats(
  rows: Property[]
): InversionesSummaryStats {
  const eligible = rows.filter((r) => !isDraft(r));

  let aportacionTotal = 0;
  let beneficioNeto = 0;
  let beneficioBruto = 0;
  let retribucionTotal = 0;
  let ingresoLiquidadas = 0;
  let operacionesLiquidadas = 0;

  for (const row of eligible) {
    const d = inversionDisplayMoney(row);
    aportacionTotal += d.aportacion;
    beneficioNeto += d.ingresoBanco;
    beneficioBruto += d.ingresoBanco + d.retencion;
    retribucionTotal += d.retribucion;

    if (propertyIsLiquidada(row)) {
      operacionesLiquidadas += 1;
      ingresoLiquidadas += d.ingresoBanco;
    }
  }

  const beneficioMedio =
    operacionesLiquidadas > 0
      ? round2(ingresoLiquidadas / operacionesLiquidadas)
      : null;

  return {
    aportacionTotal: round2(aportacionTotal),
    beneficioNeto: round2(beneficioNeto),
    beneficioBruto: round2(beneficioBruto),
    retribucionTotal: round2(retribucionTotal),
    beneficioMedio,
    operacionesLiquidadas,
  };
}
