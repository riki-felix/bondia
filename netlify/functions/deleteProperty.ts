// netlify/functions/delete-property.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Mantén el mismo patrón de variables que en tus otras Functions
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

function cors() {
  return {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Content-Type': 'application/json; charset=utf-8',
  };
}
function j(payload: any, statusCode = 200) {
  return { statusCode, headers: cors(), body: JSON.stringify(payload) };
}
function parseBody(body?: string | null) {
  if (!body) return {};
  try { return JSON.parse(body); } catch { return {}; }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST') return j({ error: 'Method not allowed' }, 405);

  try {
	if (!/^https?:\/\//i.test(SUPABASE_URL)) throw new Error('Config: SUPABASE_URL ausente o inválida');
	if (!SUPABASE_SERVICE_ROLE) throw new Error('Config: SUPABASE_SERVICE_ROLE ausente');

	const { id } = parseBody(event.body);
	if (!id || typeof id !== 'string') return j({ error: 'ID requerido' }, 400);

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
	  auth: { persistSession: false, autoRefreshToken: false },
	});

	// 1) (Opcional pero recomendable) limpiar Storage
	//    Borramos todos los objetos con prefijo "<id>/" en ambos buckets.
	//    Ignoramos errores individuales para que un fallo de storage no bloquee el borrado del registro.
	const buckets = ['property-images', 'property-plans'];
	for (const bucket of buckets) {
	  const listRes = await supabase.storage.from(bucket).list(id, { limit: 1000 }); // lista en carpeta "<id>/"
	  if (!listRes.error && listRes.data && listRes.data.length) {
		const keys = listRes.data.map((o) => `${id}/${o.name}`);
		const delRes = await supabase.storage.from(bucket).remove(keys);
		// Si hay error, lo logeamos pero no abortamos
		if (delRes.error) {
		  console.warn(`[delete-property] storage remove error in ${bucket}:`, delRes.error);
		}
	  }
	}

	// 2) borrar la fila en DB
	const { error } = await supabase
	  .from('propiedades')
	  .delete()
	  .eq('id', id);

	if (error) {
	  // Si hay FKs o restricciones, aquí lo verás
	  return j({ error: error.message, code: (error as any).code }, 500);
	}

	return j({ ok: true });
  } catch (e: any) {
	console.error('[delete-property] fatal:', e);
	return j({ error: e.message || 'Unexpected error' }, 500);
  }
};