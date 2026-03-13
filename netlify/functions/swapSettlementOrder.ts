// netlify/functions/swapSettlementOrder.ts
import type { Handler } from '@netlify/functions';
import {
  ensureConfig,
  serviceSupabase,
  json,
  parseBody,
  emptyOrNull,
} from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    ensureConfig();
    const supabase = serviceSupabase();
    const body = parseBody(event.body);

    const id = emptyOrNull(body.id);
    const newNum = Number(body.numero_liquidacion);

    if (!id) return json({ error: 'id requerido' }, 400);
    if (!Number.isFinite(newNum) || newNum < 1) return json({ error: 'numero_liquidacion inválido' }, 400);

    // Get current row
    const { data: current, error: errCurrent } = await supabase
      .from('liquidaciones')
      .select('id, numero_liquidacion')
      .eq('id', id)
      .single();

    if (errCurrent || !current) return json({ error: 'Liquidación no encontrada' }, 404);

    const oldNum = current.numero_liquidacion;
    if (oldNum === newNum) return json({ ok: true, swapped: false });

    // Find the row that currently has the target number
    const { data: target } = await supabase
      .from('liquidaciones')
      .select('id, numero_liquidacion')
      .eq('numero_liquidacion', newNum)
      .neq('id', id)
      .maybeSingle();

    // Update current row to new number
    // Use a temporary negative number to avoid potential conflicts
    const tempNum = -Math.abs(oldNum) - 99999;

    const { error: errTemp } = await supabase
      .from('liquidaciones')
      .update({ numero_liquidacion: tempNum })
      .eq('id', id);

    if (errTemp) return json({ error: errTemp.message }, 500);

    // If there was a row with that number, swap it to the old number
    if (target) {
      const { error: errB } = await supabase
        .from('liquidaciones')
        .update({ numero_liquidacion: oldNum })
        .eq('id', target.id);

      if (errB) return json({ error: errB.message }, 500);
    }

    // Now set the current row to the desired number
    const { error: errA } = await supabase
      .from('liquidaciones')
      .update({ numero_liquidacion: newNum })
      .eq('id', id);

    if (errA) return json({ error: errA.message }, 500);

    return json({ ok: true, swapped: !!target });
  } catch (e: any) {
    console.error('[swapSettlementOrder] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
