import type { Property } from "./propertyTypes";
import { calcBrutoFromRetribucion, round2 } from "./moneyCalc";
import { inversionDisplayMoney } from "./inversionesDisplayMoney";
import { computeJaspOperativa } from "./jaspOperativa";
import {
  DEFAULT_PARTICIPACION_JASP,
  DEFAULT_PARTICIPACION_SANYUS,
  effectiveParticipacionJasp,
  effectiveParticipacionSanyus,
  participacionExterna,
} from "./participacion";

export type RepartoModo = "real" | "teorico";

export interface RepartoSlice {
  id: "sanyus" | "castello" | "jasp";
  name: string;
  value: number;
}

export interface RepartoStats {
  brutoTotal: number;
  slices: RepartoSlice[];
}

/** Totales netos operativos por parte (independiente del modo bruto del gráfico). */
export interface RepartoNetoTotals {
  sanyus: number;
  castello: number;
  jasp: number;
}

const SLICE_NAMES = {
  sanyus: "Sanyus",
  castello: "Castello",
  jasp: "JASP",
} as const;

function isDraft(row: Property): boolean {
  return row.estado === "borrador";
}

/** Bruto derivado de retribución y % Sanyus (misma base que JASP y liquidaciones). */
export function brutoFromProperty(row: Property): number {
  const d = inversionDisplayMoney(row);
  const pctS = effectiveParticipacionSanyus(row.participacion_sanyus);
  if (d.retribucion <= 0) return 0;
  return calcBrutoFromRetribucion(d.retribucion, pctS);
}

export function computeBrutoTotal(rows: Property[]): number {
  let total = 0;
  for (const row of rows) {
    if (isDraft(row)) continue;
    total += brutoFromProperty(row);
  }
  return round2(total);
}

function repartoProperty(
  row: Property,
  modo: RepartoModo
): { sanyus: number; castello: number; jasp: number; bruto: number } | null {
  const d = inversionDisplayMoney(row);
  const bruto = brutoFromProperty(row);
  if (bruto <= 0) return null;

  if (modo === "real") {
    const sanyus = d.retribucion;
    const jasp = d.jasp;
    const castello = round2(Math.max(0, bruto - sanyus - jasp));
    return { bruto, sanyus, castello, jasp };
  }

  const pctCastello = participacionExterna(
    DEFAULT_PARTICIPACION_SANYUS,
    DEFAULT_PARTICIPACION_JASP
  );

  return {
    bruto,
    sanyus: round2((bruto * DEFAULT_PARTICIPACION_SANYUS) / 100),
    castello: round2((bruto * pctCastello) / 100),
    jasp: round2((bruto * DEFAULT_PARTICIPACION_JASP) / 100),
  };
}

export function computeRepartoStats(
  rows: Property[],
  modo: RepartoModo
): RepartoStats {
  let brutoTotal = 0;
  let sanyus = 0;
  let castello = 0;
  let jasp = 0;

  for (const row of rows) {
    if (isDraft(row)) continue;
    const part = repartoProperty(row, modo);
    if (!part) continue;
    brutoTotal += part.bruto;
    sanyus += part.sanyus;
    castello += part.castello;
    jasp += part.jasp;
  }

  const slices: RepartoSlice[] = (
    [
      { id: "sanyus" as const, name: SLICE_NAMES.sanyus, value: round2(sanyus) },
      { id: "castello" as const, name: SLICE_NAMES.castello, value: round2(castello) },
      { id: "jasp" as const, name: SLICE_NAMES.jasp, value: round2(jasp) },
    ] as const
  ).filter((s) => s.value > 0);

  return {
    brutoTotal: round2(brutoTotal),
    slices,
  };
}

/**
 * Netos por parte: Sanyus = transferencias (ingreso banco);
 * Castello = cuota neta sobre bruto real; JASP = real operativo.
 */
export function computeRepartoNetoTotals(rows: Property[]): RepartoNetoTotals {
  let sanyus = 0;
  let castello = 0;
  let jasp = 0;

  for (const row of rows) {
    if (isDraft(row)) continue;
    const d = inversionDisplayMoney(row);
    const pctS = effectiveParticipacionSanyus(row.participacion_sanyus);
    const pctJ = effectiveParticipacionJasp(row.participacion_jasp);
    const pctC = participacionExterna(pctS, pctJ);
    const bruto =
      Number(row.beneficio_bruto) ||
      (d.retribucion > 0 ? calcBrutoFromRetribucion(d.retribucion, pctS) : 0);

    const breakdown = computeJaspOperativa({
      beneficioBruto: bruto,
      participacionJasp: pctJ,
      participacionSanyus: pctS,
      retribucion: d.retribucion,
      ingresoBanco: d.ingresoBanco,
    });

    sanyus += d.ingresoBanco;
    jasp += breakdown.jaspReal;
    if (breakdown.brutoReal > 0 && pctC > 0) {
      castello += round2((breakdown.brutoReal * pctC) / 100);
    }
  }

  return {
    sanyus: round2(sanyus),
    castello: round2(castello),
    jasp: round2(jasp),
  };
}
