// netlify/functions/createCasaIngreso.ts
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody,
  toMoneyOrNull, toDateOrNull, emptyOrNull, slugifyEs, pickFrom,
} from './_shared';

const FREQ = new Set([
  'semanal','quincenal','mensual','bimensual',
  'trimestral','semestral','anual','puntual','variable',
]);

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    ensureConfig();
    const supabase = serviceSupabase();
    const body = parseBody(event.body);

    const ejercicio = Number(body.ejercicio);
    if (!Number.isFinite(ejercicio)) return json({ error: 'ejercicio requerido' }, 400);

    const concepto = emptyOrNull(body.concepto) ?? '';
    const frecuencia = pickFrom(body.frecuencia, FREQ) ?? 'mensual';
    const slug = concepto ? slugifyEs(concepto) + '-' + Date.now() : 'ingreso-' + Date.now();

    const row = {
      concepto,
      categoria_id: emptyOrNull(body.categoria_id),
      frecuencia,
      fecha_inicio: toDateOrNull(body.fecha_inicio),
      fecha_fin: toDateOrNull(body.fecha_fin),
      importe: toMoneyOrNull(body.importe) ?? 0,
      ejercicio,
      slug,
    };

    const { data, error } = await supabase
      .from('casa_ingresos')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      console.error('[createCasaIngreso]', error);
      return json({ error: error.message }, 500);
    }

    return json(data, 201);
  } catch (e: any) {
    console.error('[createCasaIngreso] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
