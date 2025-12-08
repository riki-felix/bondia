import { supabaseClient } from "../lib/supabaseClient";
import { toNum,formatEuro } from "../lib/money";
export type Movimiento = {
  id: string;
  concepto: string | null;
  importe: number | null;
  estado: string | null;
  fecha: string | null;
  tipo_movimiento?: 'Gasto' | 'Aportación' | string | null;
};

export type Prop = {
  id: string;
  slug: string;
  precio_compra?: number | null;
  precio_venta?: number | null;
  // Añade otros campos ligeros aquí si lo necesitas
};

const _cache: {
  prop?: Prop;
  movimientos?: Movimiento[];
  totals?: {
	total: number;
	pagado: number;
	pendiente: number;
	countPaid: number;
	countPend: number;
  };
} = {};

// ---------- Obtención de datos SSR-hidratados ----------
export function getProp(): Prop {
  if (_cache.prop) return _cache.prop;
  const el = document.getElementById("prop-data");
  if (!el) return { id: "", slug: "" };
  try {
	_cache.prop = JSON.parse(el.textContent ?? "{}") as Prop;
  } catch {
	_cache.prop = { id: "", slug: "" };
  }
  return _cache.prop!;
}

// ---------- Formateadores comunes ----------
export const fmt = {
  money(v: number | string | null | undefined): string {
    return formatEuro(v);
  },
  date(iso?: string | null): string {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return String(iso);
    }
  },
  cap(s?: string | null): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "—";
  },
};

// ---------- Estado de movimientos ----------
function getEstado(m: Movimiento): "pagado" | "pendiente" {
  const s = String(m.estado ?? "").trim().toLowerCase();
  if (["pagado", "paid", "true", "sí", "si"].includes(s)) return "pagado";
  return "pendiente";
}

export async function getMovimientos(propId: string) {
  if (_cache.movimientos && _cache.totals) {
	return { rows: _cache.movimientos, totals: _cache.totals };
  }

  const supabase = supabaseClient();
  const { data, error } = await supabase
	.from("movimientos")
	.select("id, concepto, importe, estado, fecha, tipo_movimiento")
	.eq("propiedad_id", propId)
	.order("fecha", { ascending: false });

  if (error) throw error;

  const rows = (data || []) as Movimiento[];

  // LOG: Todos los movimientos recibidos
  console.log("Movimientos recibidos desde Supabase:", rows);
  
  // LOG: Movimientos tipo_movimiento
  console.log("Tipos de movimiento:", rows.map(m => m.tipo_movimiento));


  // Filtra aportaciones
  const movimientosGasto = rows.filter(m => {
	const tipo = (m.tipo_movimiento ?? "").normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
	return tipo !== "aportacion";
  });

  console.log("Movimientos para el total:", movimientosGasto.map(m => ({ tipo: m.tipo_movimiento, importe: m.importe, estado: m.estado })));

  let total = 0, pagado = 0, pendiente = 0, countPaid = 0, countPend = 0;
  for (const m of movimientosGasto) {
	const imp = toNum(m.importe);
	const st = getEstado(m);
	total += imp;
	if (st === "pagado") { pagado += imp; countPaid++; }
	else { pendiente += imp; countPend++; }
  }

  console.log("Totales calculados: ", { total, pagado, pendiente, countPaid, countPend });

  const totals = { total, pagado, pendiente, countPaid, countPend };

  _cache.movimientos = rows;      // Todos los movimientos se muestran en la tabla
  _cache.totals = totals;         // Solo gastos (no aportaciones) en totales

  return { rows, totals };
}

export function round2(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "0";
  const n = Math.round((v + Number.EPSILON) * 100) / 100;
  return n.toLocaleString("es-ES", {
	minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
	maximumFractionDigits: 2,
  });
}

// Si necesitas resetear el cache al cambiar de propiedad:
export function resetCache() {
  _cache.prop = undefined;
  _cache.movimientos = undefined;
  _cache.totals = undefined;
}