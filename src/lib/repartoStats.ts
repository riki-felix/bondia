import type { Property } from "./propertyTypes";
import { calcBrutoFromRetribucion, round2 } from "./moneyCalc";
import { inversionDisplayMoney } from "./inversionesDisplayMoney";
import {
  DEFAULT_PARTICIPACION_JASP,
  DEFAULT_PARTICIPACION_SANYUS,
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
