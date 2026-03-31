// netlify/functions/upsertCasaOverride.ts
// Upserts a single monthly override for casa_gastos or casa_ingresos
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody,
  toMoneyOrNull, emptyOrNull,
} from './_shared';

const VALID_TYPES = new Set(['gasto', 'ingreso']);

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
    if (!tipo || !VALID_TYPES.has(tipo)) return json({ error: 'tipo debe ser "gasto" o "ingreso"' }, 400);

    const itemId = emptyOrNull(body.item_id);
    if (!itemId) return json({ error: 'item_id requerido' }, 400);

    const ejercicio = Number(body.ejercicio);
    if (!Number.isFinite(ejercicio)) return json({ error: 'ejercicio requerido' }, 400);

    const mes = Number(body.mes);
    if (!Number.isFinite(mes) || mes < 1 || mes > 12) return json({ error: 'mes debe ser 1-12' }, 400);

    const importe = toMoneyOrNull(body.importe) ?? 0;

    const table = tipo === 'gasto' ? 'casa_gastos_overrides' : 'casa_ingresos_overrides';
    const fkField = tipo === 'gasto' ? 'gasto_id' : 'ingreso_id';

    const { data, error } = await supabase
      .from(table)
      .upsert(
        { [fkField]: itemId, ejercicio, mes, importe },
        { onConflict: `${fkField},ejercicio,mes` }
      )
      .select('*')
      .single();

    if (error) {
      console.error('[upsertCasaOverride]', error);
      return json({ error: error.message }, 500);
    }

    return json(data);
  } catch (e: any) {
    console.error('[upsertCasaOverride] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
