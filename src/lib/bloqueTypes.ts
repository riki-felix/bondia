// src/lib/bloqueTypes.ts
// Generic types and helpers for block sections (Casa, Sanyus, etc.)
// Each block has Gastos, Ingresos, Activos with the same structure.

// ─── Frecuencia ──────────────────────────────────────────────

export const FRECUENCIA_VALUES = [
  "semanal",
  "quincenal",
  "mensual",
  "bimensual",
  "trimestral",
  "semestral",
  "anual",
  "puntual",
  "variable",
] as const;

export type Frecuencia = (typeof FRECUENCIA_VALUES)[number];

export const FRECUENCIA_OPTIONS: { value: Frecuencia; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "bimensual", label: "Bimensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "puntual", label: "Puntual" },
  { value: "variable", label: "Variable" },
];

export const MESES_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
] as const;

// ─── Interfaces ──────────────────────────────────────────────

export interface BloqueCategoria {
  id: string;
  nombre: string;
  slug: string;
  favorito?: boolean;
}

export interface BloqueActivoOption {
  id: string;
  nombre: string;
}

export interface BloqueGasto {
  id: string;
  concepto: string;
  categoria_id: string | null;
  activo_id: string | null;
  frecuencia: Frecuencia;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  importe: number;
  ejercicio: number;
  slug: string | null;
  metodo_pago_id: string | null;
  created_at: string;
  updated_at: string;
  categoria_nombre?: string;
  activo_nombre?: string;
}

export interface BloqueIngreso {
  id: string;
  concepto: string;
  categoria_id: string | null;
  activo_id: string | null;
  frecuencia: Frecuencia;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  importe: number;
  ejercicio: number;
  slug: string | null;
  created_at: string;
  updated_at: string;
  categoria_nombre?: string;
  activo_nombre?: string;
}

/** Mapea fila Supabase con joins de categoría y activo */
export function mapBloqueGastoRow(
  r: Record<string, unknown>,
  gastosCategTable: string,
  activosTable: string
): BloqueGasto {
  const categ = r[gastosCategTable] as { nombre?: string } | null;
  const activo = r[activosTable] as { nombre?: string } | null;
  return {
    ...(r as unknown as BloqueGasto),
    categoria_nombre: categ?.nombre ?? "",
    activo_nombre: activo?.nombre ?? "",
  };
}

export function mapBloqueIngresoRow(
  r: Record<string, unknown>,
  ingresosCategTable: string,
  activosTable: string
): BloqueIngreso {
  const categ = r[ingresosCategTable] as { nombre?: string } | null;
  const activo = r[activosTable] as { nombre?: string } | null;
  return {
    ...(r as unknown as BloqueIngreso),
    categoria_nombre: categ?.nombre ?? "",
    activo_nombre: activo?.nombre ?? "",
  };
}

export interface BloqueActivo {
  id: string;
  nombre: string;
  categoria_id: string | null;
  fecha_compra: string | null;
  precio_compra: number | null;
  valor_estimado: number | null;
  fecha_estimacion: string | null;
  foto_url: string | null;
  notas: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
  categoria_nombre?: string;
  tags?: ActivoTag[];
  caracteristica_valores?: ActivoCaracteristicaValor[];
}

export interface ActivoTag {
  id: string;
  nombre: string;
  slug: string;
  color: string;
}

export interface ActivoCaracteristica {
  id: string;
  nombre: string;
  slug: string;
  categoria_id: string | null;
}

export interface ActivoCaracteristicaValor {
  caracteristica_id: string;
  valor: string;
}

export interface BloqueOverride {
  id: string;
  gasto_id?: string;
  ingreso_id?: string;
  ejercicio: number;
  mes: number;
  importe: number;
}

export interface BloqueArea {
  id: string;
  nombre: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export type MetodoPagoTipo = 'tarjeta' | 'efectivo' | 'transferencia' | 'paypal';
export type MetodoPagoAlcance = 'casa' | 'sanyus' | 'ambos';

export interface MetodoPago {
  id: string;
  nombre: string;
  tipo: MetodoPagoTipo;
  alcance: MetodoPagoAlcance;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export const METODO_TIPO_OPTIONS: { value: MetodoPagoTipo; label: string }[] = [
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'paypal', label: 'PayPal' },
];

export const METODO_ALCANCE_OPTIONS: { value: MetodoPagoAlcance; label: string }[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'sanyus', label: 'Sanyus' },
  { value: 'ambos', label: 'Ambos' },
];

export interface BloqueAreaCategoria {
  id: string;
  area_id: string;
  tipo: "gasto" | "ingreso" | "activo";
  categoria_id: string;
}

// ─── Backward-compatible aliases ─────────────────────────────

export type CasaCategoria = BloqueCategoria;
export type CasaGasto = BloqueGasto;
export type CasaIngreso = BloqueIngreso;
export type CasaActivo = BloqueActivo;
export type CasaOverride = BloqueOverride;
export type CasaArea = BloqueArea;
export type CasaAreaCategoria = BloqueAreaCategoria;

// ─── Frequency → Month calculation ──────────────────────────

/**
 * Given a frequency and a starting month (1-based), returns which months
 * of the year are active (1-based). All within the exercise year.
 */
function frecuenciaMeses(freq: Frecuencia, mesInicio: number): Set<number> {
  const meses = new Set<number>();

  switch (freq) {
    case "mensual":
    case "quincenal":
    case "semanal":
      // Active every month
      for (let m = 1; m <= 12; m++) meses.add(m);
      break;
    case "bimensual":
      for (let m = mesInicio; m <= 12; m += 2) meses.add(m);
      break;
    case "trimestral":
      for (let m = mesInicio; m <= 12; m += 3) meses.add(m);
      break;
    case "semestral":
      for (let m = mesInicio; m <= 12; m += 6) meses.add(m);
      break;
    case "anual":
      meses.add(mesInicio);
      break;
    case "puntual":
      meses.add(mesInicio);
      break;
    case "variable":
      // No auto-fill; only overrides
      break;
  }

  return meses;
}

/**
 * Determine if a specific month (1-12) in a given exercise year
 * is within the date range [fecha_inicio, fecha_fin].
 */
function mesInRange(
  mes: number,
  ejercicio: number,
  fechaInicio: string | null,
  fechaFin: string | null
): boolean {
  // Month period: first day to last day of the month
  const monthStart = new Date(ejercicio, mes - 1, 1);
  const monthEnd = new Date(ejercicio, mes, 0); // last day of month

  if (fechaInicio) {
    const start = new Date(fechaInicio);
    if (start > monthEnd) return false;
  }

  if (fechaFin) {
    const end = new Date(fechaFin);
    if (end < monthStart) return false;
  }

  return true;
}

/**
 * Calculate the displayed amount for a specific month cell.
 *
 * Priority:
 * 1. If there's an override → use override amount
 * 2. If the month is active (frequency + date range) → use base importe
 * 3. Otherwise → null (empty cell)
 */
export function calcularImporteMes(
  item: { id: string; frecuencia: Frecuencia; fecha_inicio: string | null; fecha_fin: string | null; importe: number },
  mes: number,
  ejercicio: number,
  overrides: Map<string, number> // key = `${item_id}-${mes}`
): number | null {
  // 1. Check override
  const overrideKey = `${item.id}-${mes}`;
  if (overrides.has(overrideKey)) {
    return overrides.get(overrideKey)!;
  }

  // 2. Variable frequency → only overrides
  if (item.frecuencia === "variable") return null;

  // 3. Check if month is within date range
  if (!mesInRange(mes, ejercicio, item.fecha_inicio, item.fecha_fin)) return null;

  // 4. Check if frequency covers this month
  const mesInicio = item.fecha_inicio
    ? new Date(item.fecha_inicio).getMonth() + 1
    : 1;
  const activeMeses = frecuenciaMeses(item.frecuencia, mesInicio);

  if (!activeMeses.has(mes)) return null;

  // 5. Return base amount (adjusted for weekly frequency)
  if (item.frecuencia === "semanal") {
    // ~4.33 weeks per month
    return Math.round(item.importe * 4.33 * 100) / 100;
  }
  if (item.frecuencia === "quincenal") {
    // 2x per month
    return Math.round(item.importe * 2 * 100) / 100;
  }

  return item.importe;
}

/**
 * Build an overrides lookup map from an array of override records.
 * Key format: `${item_id}-${mes}`
 */
export function buildOverridesMap(
  overrides: BloqueOverride[],
  idField: "gasto_id" | "ingreso_id"
): Map<string, number> {
  const map = new Map<string, number>();
  for (const o of overrides) {
    const itemId = idField === "gasto_id" ? o.gasto_id : o.ingreso_id;
    if (itemId) {
      map.set(`${itemId}-${o.mes}`, o.importe);
    }
  }
  return map;
}

// ─── Cartera ─────────────────────────────────────────────────

export type CarteraId = "inversiones" | "familiar" | "sanyus" | "ahorro";

export const CARTERA_OPTIONS: { value: CarteraId; label: string }[] = [
  { value: "inversiones", label: "Inversiones" },
  { value: "familiar", label: "Familiar" },
  { value: "sanyus", label: "Sanyus" },
  { value: "ahorro", label: "Ahorro" },
];

export interface MovimientoCartera {
  id: string;
  origen: CarteraId;
  destino: CarteraId;
  concepto: string;
  importe: number;
  fecha: string;
  ejercicio: number;
  created_at: string;
}

export interface CarteraAjuste {
  id: string;
  cartera: string;
  importe: number;
  updated_at: string;
}
