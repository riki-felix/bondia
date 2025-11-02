// src/widgets/propContext.ts
import { supabaseClient } from "../lib/supabaseClient";

type Movimiento = {
  id: string;
  concepto: string | null;
  importe: number | string | null;
  estado: string | boolean | null;
  fecha: string | null;
  tipo_movimiento?: 'Gasto' | 'Aportación' | string | null;
};

type Prop = {
  id: string;
  slug: string;
  precio_compra?: number | null;
  precio_venta?: number | null;
  // añade aquí otros campos que quieras reutilizar (sin imágenes pesadas)
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

export function getProp(): Prop {
  if (_cache.prop) return _cache.prop;
  const el = document.getElementById("prop-data");
  const json = el?.textContent || "{}";
  _cache.prop = JSON.parse(json) as Prop;
  return _cache.prop!;
}

// ---------- Formatters comunes ----------
export const fmt = {
  money(v: number | string | null | undefined) {
	return Number(toNum(v)).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  },
  date(iso?: string | null) {
	if (!iso) return "—";
	try {
	  return new Date(iso).toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
	} catch { return String(iso); }
  },
  cap(s?: string | null) {
	return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "—";
  }
};

// ---------- Parsing robusto ----------
export function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v).trim();
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) { negative = true; s = s.slice(1, -1); }
  s = s.replace(/\s+/g, "").replace(/[€$£]/g, "").replace(/[^0-9,.\-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? (negative ? -n : n) : 0;
}

function getEstado(m: Movimiento): "pagado" | "pendiente" {
  const raw = m.estado;
  if (typeof raw === "boolean") return raw ? "pagado" : "pendiente";
  const s = String(raw ?? "").trim().toLowerCase();
  if (["pagado","paid","true","sí","si"].includes(s)) return "pagado";
  return "pendiente";
}

// ---------- Datos y agregados de movimientos ----------
export async function getMovimientos(propId: string) {
  if (_cache.movimientos && _cache.totals) {
	return { rows: _cache.movimientos, totals: _cache.totals };
  }

  const supabase = supabaseClient();
  const { data, error } = await supabase
	.from("movimientos")
	.select("id, concepto, importe, estado, fecha")
	.eq("propiedad_id", propId)
	.order("fecha", { ascending: false });

  if (error) throw error;

  const rows = (data || []) as Movimiento[];

  let total = 0, pagado = 0, pendiente = 0, countPaid = 0, countPend = 0;
  for (const m of rows) {
	const imp = toNum(m.importe);
	total += imp;
	const st = getEstado(m);
	if (st === "pagado") { pagado += imp; countPaid++; }
	else { pendiente += imp; countPend++; }
  }

  const totals = { total, pagado, pendiente, countPaid, countPend };
  _cache.movimientos = rows;
  _cache.totals = totals;

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