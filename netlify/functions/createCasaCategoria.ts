// netlify/functions/createCasaCategoria.ts
// Generic category creator for casa_gastos_categorias, casa_ingresos_categorias, casa_activos_categorias
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody,
  emptyOrNull, slugifyEs,
} from './_shared';

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

    const nombre = emptyOrNull(body.nombre);
    if (!nombre) return json({ error: 'nombre requerido' }, 400);

    const slug = slugifyEs(nombre);

    const { data, error } = await supabase
      .from(table)
      .upsert({ nombre, slug }, { onConflict: 'slug' })
      .select('*')
      .single();

    if (error) {
      console.error('[createCasaCategoria]', error);
      return json({ error: error.message }, 500);
    }

    return json(data, 201);
  } catch (e: any) {
    console.error('[createCasaCategoria] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
