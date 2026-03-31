// netlify/functions/syncCasaAreaCategorias.ts
// Sets the complete list of categories for an area (replaces previous)
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody, emptyOrNull,
} from './_shared';

const VALID_TIPOS = new Set(['gasto', 'ingreso', 'activo']);

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    ensureConfig();
    const supabase = serviceSupabase();
    const body = parseBody(event.body);

    const area_id = emptyOrNull(body.area_id);
    if (!area_id) return json({ error: 'area_id requerido' }, 400);

    // categorias: Array<{ tipo: string, categoria_id: string }>
    const categorias: { tipo: string; categoria_id: string }[] = body.categorias;
    if (!Array.isArray(categorias)) return json({ error: 'categorias debe ser un array' }, 400);

    // Validate tipos
    for (const c of categorias) {
      if (!VALID_TIPOS.has(c.tipo)) return json({ error: `tipo inválido: ${c.tipo}` }, 400);
      if (!c.categoria_id) return json({ error: 'categoria_id requerido en cada elemento' }, 400);
    }

    // Delete existing associations for this area
    const { error: delError } = await supabase
      .from('casa_areas_categorias')
      .delete()
      .eq('area_id', area_id);

    if (delError) {
      console.error('[syncCasaAreaCategorias] delete error:', delError);
      return json({ error: delError.message }, 500);
    }

    // Insert new associations (if any)
    if (categorias.length > 0) {
      const rows = categorias.map((c) => ({
        area_id,
        tipo: c.tipo,
        categoria_id: c.categoria_id,
      }));

      const { error: insError } = await supabase
        .from('casa_areas_categorias')
        .insert(rows);

      if (insError) {
        console.error('[syncCasaAreaCategorias] insert error:', insError);
        return json({ error: insError.message }, 500);
      }
    }

    // Return updated list
    const { data, error } = await supabase
      .from('casa_areas_categorias')
      .select('*')
      .eq('area_id', area_id);

    if (error) {
      console.error('[syncCasaAreaCategorias]', error);
      return json({ error: error.message }, 500);
    }

    return json(data);
  } catch (e: any) {
    console.error('[syncCasaAreaCategorias] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
