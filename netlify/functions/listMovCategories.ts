import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function json(payload: any, statusCode = 200) {
  return {
	statusCode,
	headers: {
	  'Access-Control-Allow-Origin': '*',
	  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	  'Access-Control-Allow-Methods': 'GET,OPTIONS',
	  'Content-Type': 'application/json',
	},
	body: JSON.stringify(payload),
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json('', 204);
  if (event.httpMethod !== 'GET') return json({ error: 'Method not allowed' }, 405);

  try {
	if (!/^https?:\/\//i.test(SUPABASE_URL)) throw new Error('SUPABASE_URL inválida');
	if (!SUPABASE_SERVICE_ROLE) throw new Error('Falta SUPABASE_SERVICE_ROLE');

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
	  auth: { persistSession: false, autoRefreshToken: false },
	});

	const { data, error } = await supabase
	  .from('movimiento_categorias')
	  .select('id, nombre, slug')
	  .order('nombre', { ascending: true });

	if (error) throw error;

	return json(data, 200);
  } catch (e: any) {
	return json({ error: e.message || String(e) }, 500);
  }
};