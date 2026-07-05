import { round2 } from "./money";
import type {
  RdsMesPiso,
  RdsMesResumen,
  RdsMovimiento,
  RdsPisoResumen,
  RdsPromo,
  RdsResumenGlobal,
} from "./rdsTypes";

export function rdsNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? round2(n) : 0;
}

function rdsInt(value: unknown): number {
  return Math.trunc(rdsNum(value));
}

export function resumenGlobal(
  movs: RdsMovimiento[],
  promos: RdsPromo[]
): RdsResumenGlobal {
  let totalGastos = 0;
  let totalIngresos = 0;
  for (const m of movs) {
    totalGastos += rdsNum(m.gasto);
    totalIngresos += rdsNum(m.ingreso);
  }
  let totalPromos = 0;
  for (const p of promos) {
    totalPromos += rdsNum(p.importe);
  }
  return {
    totalGastos: round2(totalGastos),
    totalIngresos: round2(totalIngresos),
    totalPromos: round2(totalPromos),
  };
}

export function buildMesesResumen(
  movs: RdsMovimiento[],
  promos: RdsPromo[],
  anio: number
): RdsMesResumen[] {
  const byMes: Record<number, { gastos: number; ingresos: number }> = {};
  for (const m of movs) {
    if (rdsInt(m.anio) !== rdsInt(anio)) continue;
    if (!byMes[m.mes]) byMes[m.mes] = { gastos: 0, ingresos: 0 };
    byMes[m.mes].gastos += rdsNum(m.gasto);
    byMes[m.mes].ingresos += rdsNum(m.ingreso);
  }

  const promoByMes: Record<number, number> = {};
  for (const p of promos) {
    if (rdsInt(p.anio) !== rdsInt(anio)) continue;
    promoByMes[p.mes] = (promoByMes[p.mes] ?? 0) + rdsNum(p.importe);
  }

  return Array.from({ length: 12 }, (_, idx) => {
    const mes = idx + 1;
    const base = byMes[mes] ?? { gastos: 0, ingresos: 0 };
    const promocion = round2(promoByMes[mes] ?? 0);
    const balance = round2(base.ingresos - base.gastos);
    const balanceAjustado = round2(balance - promocion);
    return {
      mes,
      gastos: round2(base.gastos),
      ingresos: round2(base.ingresos),
      promocion,
      balance,
      balanceAjustado,
      miParte: round2(balanceAjustado / 2),
    };
  });
}

export function resumenPorPiso(
  movs: RdsMovimiento[],
  anio: number
): Record<string, RdsPisoResumen> {
  const map: Record<string, { gastos: number; ingresos: number }> = {};
  for (const m of movs) {
    if (rdsInt(m.anio) !== rdsInt(anio)) continue;
    if (!map[m.piso_id]) map[m.piso_id] = { gastos: 0, ingresos: 0 };
    map[m.piso_id].gastos += rdsNum(m.gasto);
    map[m.piso_id].ingresos += rdsNum(m.ingreso);
  }

  const out: Record<string, RdsPisoResumen> = {};
  for (const [pisoId, vals] of Object.entries(map)) {
    const gastos = round2(vals.gastos);
    const ingresos = round2(vals.ingresos);
    out[pisoId] = {
      gastos,
      ingresos,
      beneficio: round2(ingresos - gastos),
    };
  }
  return out;
}

export function mesesPorPiso(
  movs: RdsMovimiento[],
  pisoId: string,
  anio: number
): RdsMesPiso[] {
  const byMes: Record<number, { gasto: number; ingreso: number }> = {};
  for (const m of movs) {
    if (String(m.piso_id) !== String(pisoId) || rdsInt(m.anio) !== rdsInt(anio)) continue;
    byMes[rdsInt(m.mes)] = {
      gasto: rdsNum(m.gasto),
      ingreso: rdsNum(m.ingreso),
    };
  }

  return Array.from({ length: 12 }, (_, idx) => {
    const mes = idx + 1;
    const base = byMes[mes] ?? { gasto: 0, ingreso: 0 };
    return {
      mes,
      gasto: base.gasto,
      ingreso: base.ingreso,
      balance: round2(base.ingreso - base.gasto),
    };
  });
}

export function promoByMesMap(promos: RdsPromo[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (const p of promos) {
    map[p.mes] = rdsNum(p.importe);
  }
  return map;
}

export function beneficioFromResumen(resumen: RdsResumenGlobal) {
  const beneficio = round2(resumen.totalIngresos - resumen.totalGastos);
  const beneficioAjustado = round2(beneficio - resumen.totalPromos);
  return {
    beneficio,
    beneficioAjustado,
    miParte: round2(beneficioAjustado / 2),
  };
}

export function yearOptions(currentYear: number, span = 6): number[] {
  const start = currentYear - Math.floor(span / 2);
  return Array.from({ length: span }, (_, i) => start + i);
}

/** Años visibles: ventana alrededor del actual + años con datos o seleccionados. */
export function rdsYearOptions(
  currentYear: number,
  extraYears: number[] = [],
  span = 6
): number[] {
  const set = new Set(yearOptions(currentYear, span));
  for (const y of extraYears) {
    if (Number.isFinite(y)) set.add(y);
  }
  return [...set].sort((a, b) => a - b);
}

export function parseRdsYear(
  raw: string | null | undefined,
  fallback: number
): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : fallback;
}
