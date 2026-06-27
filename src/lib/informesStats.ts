import type { Property } from "./propertyTypes";
import { round2 } from "./moneyCalc";
import { propertyEjercicio, propertyIsLiquidada } from "./fetchInversionesWithLiquidaciones";
import { inversionDisplayMoney } from "./inversionesDisplayMoney";

/** Propiedad con precios de compra/venta; solo se cargan en la página Informes. */
export type InformesProperty = Property & {
  precio_compra: number | null;
  precio_venta: number | null;
};

export interface PropiedadPorAnioItem {
  id: string;
  titulo: string;
  numero_operacion: number | null;
}

export interface PropiedadesPorAnioEntry {
  year: number;
  count: number;
  properties: PropiedadPorAnioItem[];
}

export interface InformesStats {
  beneficioNeto: number;
  beneficioBruto: number;
  beneficioMedio: number | null;
  operacionesLiquidadas: number;
  ingresoLiquidadas: number;
  retencionesLiquidadas: number;
  brutoLiquidadas: number;
  aportacion: number;
  retribucion: number;
  jaspTotal: number;
  transferenciaTotal: number;
  retencionesTotal: number;
  efectivoTotal: number;
  propiedadesPorAnio: { year: number; count: number }[];
}

export interface PreciosMediosStats {
  precioMedioCompra: number | null;
  precioMedioVenta: number | null;
  comprasEnVista: number;
  ventasEnVista: number;
}

function isDraft(row: Property): boolean {
  return row.estado === "borrador";
}

export function filterInformesRows<T extends Property>(
  rows: T[],
  yearFilter: string,
  showLiquidadas: boolean,
  showSinLiquidacion: boolean
): T[] {
  let result = rows;

  if (showLiquidadas) {
    result = result.filter((r) => propertyIsLiquidada(r));
  } else if (showSinLiquidacion) {
    result = result.filter((r) => !propertyIsLiquidada(r));
  }

  if (yearFilter !== "all") {
    const y = Number(yearFilter);
    result = result.filter((r) => {
      const ej = propertyEjercicio(r);
      if (ej != null) return ej === y;
      const dateStr = r.fecha_ingreso || r.created_at;
      if (!dateStr) return false;
      return new Date(dateStr).getFullYear() === y;
    });
  }

  return result;
}

/** Filas para precios medios: por ejercicio fiscal de la propiedad (no liquidación ni fechas). */
export function filterInformesRowsForPreciosMedios<T extends Property>(
  rows: T[],
  yearFilter: string,
  showLiquidadas: boolean,
  showSinLiquidacion: boolean
): T[] {
  let result = rows;

  if (showLiquidadas) {
    result = result.filter((r) => propertyIsLiquidada(r));
  } else if (showSinLiquidacion) {
    result = result.filter((r) => !propertyIsLiquidada(r));
  }

  if (yearFilter !== "all") {
    const y = Number(yearFilter);
    result = result.filter((r) => r.ejercicio === y);
  }

  return result;
}

export function computeInformesStats(rows: Property[]): InformesStats {
  const eligible = rows.filter((r) => !isDraft(r));

  let beneficioNeto = 0;
  let beneficioBruto = 0;
  let retribucion = 0;
  let aportacion = 0;
  let jaspTotal = 0;
  let retencionesTotal = 0;
  let efectivoTotal = 0;
  let transferenciaTotal = 0;
  let ingresoLiquidadas = 0;
  let retencionesLiquidadas = 0;
  let brutoLiquidadas = 0;
  let operacionesLiquidadas = 0;

  for (const row of eligible) {
    const d = inversionDisplayMoney(row);
    beneficioNeto += d.ingresoBanco;
    beneficioBruto += d.ingresoBanco + d.retencion;
    retribucion += d.retribucion;
    aportacion += d.aportacion;
    jaspTotal += d.jasp;
    retencionesTotal += d.retencion;
    efectivoTotal += d.efectivo;
    transferenciaTotal += d.ingresoBanco;

    if (propertyIsLiquidada(row)) {
      operacionesLiquidadas += 1;
      ingresoLiquidadas += d.ingresoBanco;
      retencionesLiquidadas += d.retencion;
      brutoLiquidadas += d.ingresoBanco + d.retencion;
    }
  }

  const propiedadesPorAnio = computePropiedadesPorAnio(rows).map(
    ({ year, count }) => ({ year, count })
  );

  const beneficioMedio =
    operacionesLiquidadas > 0
      ? round2(ingresoLiquidadas / operacionesLiquidadas)
      : null;

  return {
    beneficioNeto: round2(beneficioNeto),
    beneficioBruto: round2(beneficioBruto),
    beneficioMedio,
    operacionesLiquidadas,
    ingresoLiquidadas: round2(ingresoLiquidadas),
    retencionesLiquidadas: round2(retencionesLiquidadas),
    brutoLiquidadas: round2(brutoLiquidadas),
    aportacion: round2(aportacion),
    retribucion: round2(retribucion),
    jaspTotal: round2(jaspTotal),
    transferenciaTotal: round2(transferenciaTotal),
    retencionesTotal: round2(retencionesTotal),
    efectivoTotal: round2(efectivoTotal),
    propiedadesPorAnio,
  };
}

/** Media de precio_compra / precio_venta de la ficha de propiedad (solo widgets Informes). */
export function computePropiedadesPorAnio(
  rows: Property[]
): PropiedadesPorAnioEntry[] {
  const eligible = rows.filter((r) => !isDraft(r));
  const byYear = new Map<number, PropiedadPorAnioItem[]>();

  for (const row of eligible) {
    const ej = propertyEjercicio(row);
    if (ej == null) continue;

    const list = byYear.get(ej) ?? [];
    list.push({
      id: row.id,
      titulo:
        row.titulo?.trim() ||
        (row.numero_operacion != null
          ? `Operación ${row.numero_operacion}`
          : "Sin nombre"),
      numero_operacion: row.numero_operacion,
    });
    byYear.set(ej, list);
  }

  return [...byYear.entries()]
    .map(([year, properties]) => ({
      year,
      count: properties.length,
      properties: properties.sort((a, b) => {
        const na = a.numero_operacion ?? Number.MAX_SAFE_INTEGER;
        const nb = b.numero_operacion ?? Number.MAX_SAFE_INTEGER;
        if (na !== nb) return na - nb;
        return a.titulo.localeCompare(b.titulo, "es");
      }),
    }))
    .sort((a, b) => a.year - b.year);
}

export function computePreciosMedios(rows: InformesProperty[]): PreciosMediosStats {
  const eligible = rows.filter((r) => r.estado !== "borrador");

  let sumCompra = 0;
  let comprasEnVista = 0;
  let sumVenta = 0;
  let ventasEnVista = 0;

  for (const row of eligible) {
    const precioCompra = Number(row.precio_compra) || 0;
    if (precioCompra > 0) {
      sumCompra += precioCompra;
      comprasEnVista += 1;
    }

    const precioVenta = Number(row.precio_venta) || 0;
    if (precioVenta > 0) {
      sumVenta += precioVenta;
      ventasEnVista += 1;
    }
  }

  return {
    precioMedioCompra:
      comprasEnVista > 0 ? round2(sumCompra / comprasEnVista) : null,
    precioMedioVenta: ventasEnVista > 0 ? round2(sumVenta / ventasEnVista) : null,
    comprasEnVista,
    ventasEnVista,
  };
}

export function computeMargenPct(
  transferenciaTotal: number,
  invertido: number
): number | null {
  if (invertido <= 0) return null;
  return Math.round((transferenciaTotal / invertido) * 100);
}

/** Monto / capital invertido (ej. bruto 300k / invertido 100k → 3). */
export function computeUsoCapitalMultiple(
  monto: number,
  invertido: number
): number | null {
  if (invertido <= 0 || monto < 0) return null;
  return round2(monto / invertido);
}

/** Variación % respecto al año anterior (null si no es comparable). */
export function computeYearOverYearPct(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current == null || previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export function collectInformesYears(rows: Property[]): number[] {
  const yearSet = new Set<number>();
  for (const p of rows) {
    const ej = propertyEjercicio(p);
    if (ej != null) yearSet.add(ej);
    const dateStr = p.fecha_ingreso || p.created_at;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!Number.isNaN(d.getTime())) yearSet.add(d.getFullYear());
    }
  }
  return Array.from(yearSet).sort((a, b) => b - a);
}

export function maxInformesUpdatedAt(
  properties: { updated_at?: string | null }[],
  liquidaciones: { updated_at?: string | null }[]
): string | null {
  let max: number | null = null;
  for (const p of properties) {
    if (!p.updated_at) continue;
    const t = new Date(p.updated_at).getTime();
    if (!Number.isNaN(t)) max = max == null ? t : Math.max(max, t);
  }
  for (const l of liquidaciones) {
    if (!l.updated_at) continue;
    const t = new Date(l.updated_at).getTime();
    if (!Number.isNaN(t)) max = max == null ? t : Math.max(max, t);
  }
  return max != null ? new Date(max).toISOString() : null;
}
