export const prerender = false;

import type { APIContext } from 'astro';
import { createServerClient } from '@supabase/ssr';

const URL  = import.meta.env.PUBLIC_SUPABASE_URL!;
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(ctx: APIContext) {
  try {
	const { request, cookies } = ctx;
	const body = await request.json().catch(() => ({}));

	const supabase = createServerClient(URL, ANON, {
	  cookies: {
		get: (k) => cookies.get(k)?.value,
		set: (k, v, opts) => cookies.set(k, v, { path: '/', ...opts }),
		remove: (k, opts) => cookies.delete(k, { path: '/', ...opts }),
	  },
	});

	// 1) PKCE / OAuth
	if (body.codeUrl) {
	  const { error } = await supabase.auth.exchangeCodeForSession(body.codeUrl);
	  if (error) return json({ error: error.message }, 400);
	  return new Response(null, { status: 204 });
	}

	// 2) verifyOtp (token_hash)
	if (body.token_hash) {
	  const { token_hash, type = 'magiclink' } = body;
	  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
	  if (error) return json({ error: error.message }, 400);
	  return new Response(null, { status: 204 });
	}

	// 3) setSession (access/refresh)
	if (body.access_token && body.refresh_token) {
	  const { error } = await supabase.auth.setSession({
		access_token: body.access_token,
		refresh_token: body.refresh_token,
	  });
	  if (error) return json({ error: error.message }, 400);
	  return new Response(null, { status: 204 });
	}

	return json({ error: 'missing payload' }, 400);
  } catch (e: any) {
	return json({ error: e?.message || 'unknown' }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
	status,
	headers: { 'content-type': 'application/json' },
  });
}