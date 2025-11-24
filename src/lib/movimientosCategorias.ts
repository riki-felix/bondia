// src/lib/movimientosCategorias.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CategoriaResumen {
  categoria_id: string | null;
  categoria_nombre: string | null;
  anio: number | null;
  num_movimientos: number | null;
  total_importe: number | null;
}

interface LoadOpts {
  supabase: SupabaseClient;
  year: number | null;   // año concreto o null
  modeTotals: boolean;   // true = TOTALES, false = solo un año
}

/**
 * Carga el resumen de categorías desde la vista
 * `movimientos_categorias_resumen`.
 *
 * - modeTotals = false + year => devuelve solo ese año (filtrado en JS)
 * - modeTotals = true         => suma TODOS los años por categoría
 */
export async function loadCategoriasResumen({
  supabase,
  year,
  modeTotals,
}: LoadOpts): Promise<{ rows: CategoriaResumen[]; error: any }> {
  const { data, error } = await supabase
	.from("movimientos_categorias_resumen")
	.select("categoria_id, categoria_nombre, anio, num_movimientos, total_importe");

  if (error) {
	return { rows: [], error };
  }

  const rows = (data ?? []) as CategoriaResumen[];

  // Caso 1: AÑO concreto (no totales) → filtramos en JS
  if (!modeTotals && year) {
	const filtered = rows
	  .filter((r) => r.anio === year)
	  .sort(
		(a, b) =>
		  Number(b.total_importe ?? 0) - Number(a.total_importe ?? 0)
	  );

	return { rows: filtered, error: null };
  }

  // Caso 2: TOTALES → agregamos todas las filas por categoría
  const map = new Map<
	string,
	{
	  categoria_id: string | null;
	  categoria_nombre: string | null;
	  anio: null;
	  num_movimientos: number;
	  total_importe: number;
	}
  >();

  for (const r of rows) {
	const key = r.categoria_nombre || "Sin categoría";

	if (!map.has(key)) {
	  map.set(key, {
		categoria_id: r.categoria_id,
		categoria_nombre: key,
		anio: null,
		num_movimientos: 0,
		total_importe: 0,
	  });
	}

	const acc = map.get(key)!;
	acc.num_movimientos += r.num_movimientos ?? 0;
	acc.total_importe += Number(r.total_importe ?? 0);
  }

  const agregadas = Array.from(map.values()).sort(
	(a, b) => (b.total_importe ?? 0) - (a.total_importe ?? 0)
  );

  return { rows: agregadas, error: null };
}