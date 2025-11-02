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
	  'Access-Control-Allow-Methods': 'POST, OPTIONS',
	  'Content-Type': 'application/json; charset=utf-8',
	},
	body: JSON.stringify(payload),
  };
}
function parseBody(body?: string | null) {
  if (!body) return {};
  try { return JSON.parse(body); } catch { return {}; }
}
function slugifyEs(s: string): string {
  return s
	.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.replace(/[^a-z0-9\s-]/g, '')
	.trim()
	.replace(/\s+/g, '-')
	.replace(/-+/g, '-');
}
async function findNextUniqueSlug(supabase: any, table: string, base: string): Promise<string> {
  const { data, error } = await supabase
	.from(table)
	.select('slug')
	.ilike('slug', `${base}%`);
  if (error) return base;
  const taken = new Set<string>((data || []).map((r: any) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2; while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json('', 204);
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	if (!/^https?:\/\//i.test(SUPABASE_URL)) throw new Error('Config: SUPABASE_URL ausente o inválida');
	if (!SUPABASE_SERVICE_ROLE) throw new Error('Config: SUPABASE_SERVICE_ROLE ausente');

	const body = parseBody(event.body);
	const nombreRaw = (body?.nombre ?? '').toString().trim();
	if (!nombreRaw) return json({ error: 'Falta nombre' }, 400);

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
	  auth: { persistSession: false, autoRefreshToken: false },
	});

	// Si tienes unique(nombre), puedes chequear conflicto “bonito”
	// const { data: exists } = await supabase.from('movimiento_categorias').select('id').eq('nombre', nombreRaw).maybeSingle();
	// if (exists) return json({ error: 'La categoría ya existe' }, 409);

	const base = slugifyEs(nombreRaw) || 'categoria';
	const slug = await findNextUniqueSlug(supabase, 'movimiento_categorias', base);

	const { data, error } = await supabase
	  .from('movimiento_categorias')
	  .insert({ nombre: nombreRaw, slug })
	  .select('id, nombre, slug')
	  .single();

	if (error) {
	  // Responder y salir; NO sigas tras insertar
	  return json({ error: error.message, code: (error as any).code, details: (error as any).details }, 500);
	}

	// ÉXITO: responde 201 y termina
	return json({ id: data.id, nombre: data.nombre, slug: data.slug }, 201);

  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};