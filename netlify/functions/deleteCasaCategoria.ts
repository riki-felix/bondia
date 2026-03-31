// netlify/functions/deleteCasaCategoria.ts
import type { Handler } from '@netlify/functions';
import { ensureConfig, serviceSupabase, json, ok, parseBody, emptyOrNull } from './_shared';

const TABLE_MAP: Record<string, string> = {
  gasto: 'casa_gastos_categorias',
  ingreso: 'casa_ingresos_categorias',
  activo: 'casa_activos_categorias',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    ensureConfig();
    const supabase = serviceSupabase();
    const body = parseBody(event.body);

    const tipo = body.tipo;
    const table = TABLE_MAP[tipo];
    if (!table) return json({ error: 'tipo debe ser "gasto", "ingreso" o "activo"' }, 400);

    const id = emptyOrNull(body.id);
    if (!id) return json({ error: 'id requerido' }, 400);

    // FK is ON DELETE SET NULL, so items keep existing but lose their category
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      console.error('[deleteCasaCategoria]', error);
      return json({ error: error.message }, 500);
    }

    return ok();
  } catch (e: any) {
    console.error('[deleteCasaCategoria] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
