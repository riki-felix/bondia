import type { SupabaseClient } from "@supabase/supabase-js";
import type { BloqueConfig } from "./bloqueConfig";
import {
  mapBloqueGastoRow,
  mapBloqueIngresoRow,
  type BloqueActivoOption,
  type BloqueArea,
  type BloqueAreaCategoria,
  type BloqueCategoria,
  type BloqueGasto,
  type BloqueIngreso,
  type BloqueOverride,
  type MetodoPago,
} from "./bloqueTypes";

export interface BloqueActivoMovimientosPayload {
  ejercicio: number;
  linkedGastosCount: number;
  linkedIngresosCount: number;
  gastos: BloqueGasto[];
  gastosOverrides: BloqueOverride[];
  ingresos: BloqueIngreso[];
  ingresosOverrides: BloqueOverride[];
  gastosCategorias: BloqueCategoria[];
  ingresosCategorias: BloqueCategoria[];
  areas: BloqueArea[];
  areaAssignments: BloqueAreaCategoria[];
  activos: BloqueActivoOption[];
  metodosPago: MetodoPago[];
}

export async function fetchActivoMovimientos(
  supabase: SupabaseClient,
  cfg: BloqueConfig,
  activoId: string,
  ejercicio: number
): Promise<BloqueActivoMovimientosPayload> {
  const metodoAlcance = cfg.id === "casa" ? ["casa", "ambos"] : ["sanyus", "ambos"];
  const gastosSelect = `*, ${cfg.joins.gastosCateg}, ${cfg.tables.activos}(nombre)`;
  const ingresosSelect = `*, ${cfg.joins.ingresosCateg}, ${cfg.tables.activos}(nombre)`;

  const [
    gastosCountRes,
    ingresosCountRes,
    gastosRes,
    gastosOvrRes,
    ingresosRes,
    ingresosOvrRes,
    gastosCategRes,
    ingresosCategRes,
    areasRes,
    areasAssignRes,
    activosRes,
    metodosRes,
  ] = await Promise.all([
    supabase
      .from(cfg.tables.gastos)
      .select("*", { count: "exact", head: true })
      .eq("activo_id", activoId),
    supabase
      .from(cfg.tables.ingresos)
      .select("*", { count: "exact", head: true })
      .eq("activo_id", activoId),
    supabase
      .from(cfg.tables.gastos)
      .select(gastosSelect)
      .eq("activo_id", activoId)
      .eq("ejercicio", ejercicio)
      .order("created_at", { ascending: true }),
    supabase
      .from(cfg.tables.gastosOverrides)
      .select("*")
      .eq("ejercicio", ejercicio),
    supabase
      .from(cfg.tables.ingresos)
      .select(ingresosSelect)
      .eq("activo_id", activoId)
      .eq("ejercicio", ejercicio)
      .order("created_at", { ascending: true }),
    supabase
      .from(cfg.tables.ingresosOverrides)
      .select("*")
      .eq("ejercicio", ejercicio),
    supabase
      .from(cfg.tables.gastosCateg)
      .select("id, nombre, slug, favorito")
      .order("nombre", { ascending: true }),
    supabase
      .from(cfg.tables.ingresosCateg)
      .select("id, nombre, slug, favorito")
      .order("nombre", { ascending: true }),
    supabase.from(cfg.tables.areas).select("*").order("nombre"),
    supabase.from(cfg.tables.areasCategorias).select("*"),
    supabase
      .from(cfg.tables.activos)
      .select("id, nombre")
      .order("nombre", { ascending: true }),
    supabase
      .from("metodos_pago")
      .select("*")
      .in("alcance", metodoAlcance)
      .eq("activo", true)
      .order("nombre"),
  ]);

  const gastos = ((gastosRes.data ?? []) as any[]).map((r) =>
    mapBloqueGastoRow(r, cfg.tables.gastosCateg, cfg.tables.activos)
  );
  const ingresos = ((ingresosRes.data ?? []) as any[]).map((r) =>
    mapBloqueIngresoRow(r, cfg.tables.ingresosCateg, cfg.tables.activos)
  );

  return {
    ejercicio,
    linkedGastosCount: gastosCountRes.count ?? 0,
    linkedIngresosCount: ingresosCountRes.count ?? 0,
    gastos,
    gastosOverrides: gastosOvrRes.data ?? [],
    ingresos,
    ingresosOverrides: ingresosOvrRes.data ?? [],
    gastosCategorias: gastosCategRes.data ?? [],
    ingresosCategorias: ingresosCategRes.data ?? [],
    areas: areasRes.data ?? [],
    areaAssignments: areasAssignRes.data ?? [],
    activos: activosRes.data ?? [],
    metodosPago: metodosRes.data ?? [],
  };
}
