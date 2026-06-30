import type { Property } from "./propertyTypes";
import { calcBrutoFromRetribucion } from "./moneyCalc";
import {
  effectiveParticipacionJasp,
  effectiveParticipacionSanyus,
} from "./participacion";
import { propertyIsLiquidada } from "./fetchInversiones";
import { computeJaspOperativa, type JaspOperativaBreakdown } from "./jaspOperativa";

export const INVERSION_OPERATIVA_SELECT =
  "beneficio_bruto, fecha_liquidacion, fecha_aportacion, fecha_transferencia, numero_op_liquidacion, liquidada_at" as const;

/** Campos financieros bloqueados tras liquidar (cierre definitivo). */
export const LOCKED_WHEN_LIQUIDADA = [
  "aportacion",
  "retribucion",
  "ingreso_banco",
  "beneficio_bruto",
  "jasp_10_percent",
  "fecha_aportacion",
  "fecha_transferencia",
  "fecha_liquidacion",
  "numero_op_liquidacion",
  "participacion_sanyus",
  "participacion_jasp",
] as const;

export function isFieldLockedWhenLiquidada(
  field: string,
  liquidada: boolean
): boolean {
  if (!liquidada) return false;
  return (LOCKED_WHEN_LIQUIDADA as readonly string[]).includes(field);
}

export function effectiveBeneficioBruto(row: Property): number {
  const direct = Number(row.beneficio_bruto) || 0;
  if (direct > 0) return direct;
  const retribucion = Number(row.retribucion) || 0;
  if (retribucion <= 0) return 0;
  return calcBrutoFromRetribucion(
    retribucion,
    effectiveParticipacionSanyus(row.participacion_sanyus)
  );
}

export function jaspBreakdownForProperty(row: Property): JaspOperativaBreakdown {
  const retribucion = Number(row.retribucion) || 0;
  const ingresoBanco = Number(row.ingreso_banco) || 0;
  return computeJaspOperativa({
    beneficioBruto: effectiveBeneficioBruto(row),
    participacionJasp: effectiveParticipacionJasp(row.participacion_jasp),
    participacionSanyus: effectiveParticipacionSanyus(row.participacion_sanyus),
    retribucion,
    ingresoBanco,
  });
}

export function canEditFinancialField(row: Property, field: string): boolean {
  return !isFieldLockedWhenLiquidada(field, propertyIsLiquidada(row));
}
