// src/middleware.ts
import { defineMiddleware } from 'astro/middleware';

// Rutas públicas (no requieren sesión)
const isAllowlisted = (p: string) => {
  if (p === '/login') return true;
  if (p.startsWith('/auth/callback')) return true;
  if (p.startsWith('/api/auth/')) return true;

  // Assets / dev
  if (p.startsWith('/favicon')) return true;
  if (p.startsWith('/robots.txt')) return true;
  if (p.startsWith('/manifest')) return true;
  if (p.startsWith('/_astro')) return true;
  if (p.startsWith('/assets')) return true;
  if (p.startsWith('/_image')) return true;
  if (p.startsWith('/.well-known')) return true;

  // Vite dev internals
  if (p.startsWith('/@fs')) return true;
  if (p.startsWith('/@id')) return true;
  if (p.startsWith('/@vite')) return true;

  return false;
};

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;

  // Solo ejemplo: deja pasar si está en lista blanca
  if (isAllowlisted(path)) {
    return next();
  }

  // Más adelante aquí protegerás con sesión Supabase
  return next();
});
