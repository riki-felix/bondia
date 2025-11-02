// netlify/functions/listMovements.ts
import type { Handler } from '@netlify/functions';
import { serviceSupabase, json, ok, parseBody } from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();

  const supabase = serviceSupabase();

  const url = new URL(event.rawUrl || `http://x${event.path}${event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters as any) : ''}`);
  const limit  = Math.min(Number(url.searchParams.get('limit') ?? 100), 200);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);

  const { data, error } = await supabase
	.from('movimientos')
	.select(`
	  id,
	  slug,
	  concepto,
	  fecha,
	  importe,
	  estado,
	  propiedad_id,
	  categoria_id,
	  propiedad:propiedades ( titulo ),
	  categoria:movimiento_categorias ( nombre ),
	  tags:movimiento_tag_map (
		tag:movimiento_tags ( nombre )
	  )
	`)
	.order('fecha', { ascending: false })
	.range(offset, offset + limit - 1);

  if (error) return json({ error: error.message }, 500);

  const items = (data || []).map((m: any) => ({
	id: m.id,
	slug: m.slug, // <- NECESARIO PARA EL BOTÓN EDITAR
	concepto: m.concepto,
	fecha: m.fecha,
	importe: m.importe,
	estado: m.estado,
	propiedad_titulo: m.propiedad?.titulo ?? null,
	categoria_nombre: m.categoria?.nombre ?? null,
	etiquetas: (m.tags || []).map((t: any) => t?.tag?.nombre).filter(Boolean),
  }));

  return json({ data: items }, 200);
};