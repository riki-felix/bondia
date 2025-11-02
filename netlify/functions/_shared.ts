// netlify/functions/_shared.ts
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const DEFAULT_CATEGORY_ID = '00000000-0000-0000-0000-000000000001';

export function json(payload: any, statusCode = 200) {
  return {
	statusCode,
	headers: {
	  'Access-Control-Allow-Origin': '*',
	  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
	  'Content-Type': 'application/json; charset=utf-8',
	},
	body: JSON.stringify(payload),
  };
}

export function ok() {
  return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }, body: '' };
}

export function parseBody(body?: string | null) {
  if (!body) return {};
  try { return JSON.parse(body); } catch { return {}; }
}

export function ensureConfig() {
  if (!/^https?:\/\//i.test(SUPABASE_URL)) throw new Error('Config: SUPABASE_URL ausente o inválida');
  if (!SUPABASE_SERVICE_ROLE) throw new Error('Config: SUPABASE_SERVICE_ROLE ausente');
}

export function serviceSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });
}

// -----------------------------------------------
// Texto/slug
export function emptyOrNull(v: any) { if (v == null) return null; const s = String(v).trim(); return s === '' ? null : s; }
export function slugifyEs(s: string): string {
  return s
	.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.replace(/[^a-z0-9\s-]/g, '')
	.trim()
	.replace(/\s+/g, '-')
	.replace(/-+/g, '-');
}

// -----------------------------------------------
// Números / dinero (formato español tolerante)
//  "1.234,56" => "1234.56"; "1234.56" => "1234.56"; "800" => "800"
export function normalizeMoneyLike(v: any): string | null {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  s = s.replace(/\s+/g, '');
  const hasComma = s.includes(',');
  if (hasComma) {
	s = s.replace(/\./g, '');
	const last = s.lastIndexOf(',');
	const intPart = s.slice(0, last).replace(/,/g, '');
	const decPart = s.slice(last + 1);
	s = intPart + (decPart ? ('.' + decPart) : '');
  } else {
	const last = s.lastIndexOf('.');
	if (last >= 0) {
	  const intPart = s.slice(0, last).replace(/\./g, '');
	  const decPart = s.slice(last + 1);
	  s = intPart + (decPart ? ('.' + decPart) : '');
	}
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return s;
}
export function toMoneyOrNull(v: any): number | null {
  const canon = normalizeMoneyLike(v);
  if (canon == null) return null;
  const n = Number(canon);
  if (!Number.isFinite(n)) return null;
  if (Math.trunc(Math.abs(n)) >= 1_000_000_000) return null; // 9 dígitos enteros máx.
  return Number(n.toFixed(2));
}

export function toDateOrNull(v: any): string | null {
  const s = emptyOrNull(v);
  if (!s) return null;
  // esperamos "YYYY-MM-DD"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export function pickFrom(v: any, allowed: Set<string>) {
  if (typeof v !== 'string') return null;
  const x = v.trim().toLowerCase();
  return allowed.has(x) ? x : null;
}