// src/pages/api/auth/set.ts
export const prerender = false;

import type { APIContext } from 'astro';
import { createServerClient } from '@supabase/ssr';

const URL  = import.meta.env.PUBLIC_SUPABASE_URL;
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export async function OPTIONS() {
  // útil si haces peticiones fetch desde el cliente (CORS simple)
  return new Response(null, { status: 204 });
}

export async function POST(ctx: APIContext) {
  try {
	if (!URL || !ANON) {
	  return json({ error: 'Missing Supabase env (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY)' }, 500);
	}

	const { request, cookies } = ctx;

	// Aseguramos JSON y fallamos de forma clara si no lo es
	if (!request.headers.get('content-type')?.includes('application/json')) {
	  return json({ error: 'Content-Type must be application/json' }, 415);
	}

	const body = await request.json().catch(() => ({} as any));

	const isProd = process.env.NODE_ENV === 'production';
	const cookieBase = {
	  path: '/',
	  httpOnly: true,
	  sameSite: 'lax' as const,
	  secure: isProd, // cookies seguras en prod
	};

	const supabase = createServerClient(URL, ANON, {
	  cookies: {
		get: (k) => cookies.get(k)?.value,
		set: (k, v, opts) => cookies.set(k, v, { ...cookieBase, ...opts }),
		remove: (k, opts) => cookies.delete(k, { ...cookieBase, ...opts }),
	  },
	});

	// 1) PKCE / OAuth (recibe la URL completa con el ?code=...)
	if (typeof body.codeUrl === 'string' && body.codeUrl.startsWith('http')) {
	  const { error } = await supabase.auth.exchangeCodeForSession(body.codeUrl);
	  if (error) return json({ error: error.message }, 400);
	  return new Response(null, { status: 204 });
	}

	// 2) verifyOtp (token_hash de magic link)
	if (typeof body.token_hash === 'string') {
	  const type = (body.type as 'magiclink' | 'signup' | 'recovery' | 'invite' | 'email_change') ?? 'magiclink';
	  const { error } = await supabase.auth.verifyOtp({ type, token_hash: body.token_hash });
	  if (error) return json({ error: error.message }, 400);
	  return new Response(null, { status: 204 });
	}

	// 3) setSession (access/refresh directos)
	if (typeof body.access_token === 'string' && typeof body.refresh_token === 'string') {
	  const { error } = await supabase.auth.setSession({
		access_token: body.access_token,
		refresh_token: body.refresh_token,
	  });
	  if (error) return json({ error: error.message }, 400);
	  return new Response(null, { status: 204 });
	}

	// Payload no reconocido
	return json({ error: 'missing payload (expected codeUrl | token_hash | access_token+refresh_token)' }, 400);
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