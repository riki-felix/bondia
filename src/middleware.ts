// src/middleware.ts
import { defineMiddleware } from 'astro/middleware';
import { createSupabaseServerClient } from './lib/supabaseServer';

/**
 * Checks if a path is whitelisted (publicly accessible without authentication)
 */
const isAllowlisted = (p: string): boolean => {
  // Auth routes
  if (p === '/login') return true;
  if (p.startsWith('/auth/callback')) return true;
  if (p.startsWith('/api/auth/')) return true;

  // Static assets
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

/**
 * Middleware to enforce session-based access control across the site.
 * - Whitelisted routes (login, auth callback, static assets) are allowed without authentication
 * - All other routes require a valid Supabase session
 * - Unauthenticated users are redirected to /login with an error message
 */
export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;

  // Allow whitelisted routes to pass through
  if (isAllowlisted(path)) {
    return next();
  }

  // Create Supabase client with cookie-based session management
  const supabase = createSupabaseServerClient(ctx.cookies, ctx.request);

  try {
    // Check for an active session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session verification error:', error.message);
      // Redirect to login with error message
      return ctx.redirect(`/login?error=${encodeURIComponent('Session verification failed. Please log in again.')}`);
    }

    if (!session) {
      // No active session - redirect to login
      const returnUrl = encodeURIComponent(path);
      return ctx.redirect(`/login?redirect=${returnUrl}&error=${encodeURIComponent('Please log in to access this page.')}`);
    }

    // Session is valid - store user in locals for use in pages
    ctx.locals.user = session.user;
    ctx.locals.session = session;

    return next();
  } catch (err) {
    console.error('Unexpected error in auth middleware:', err);
    return ctx.redirect(`/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`);
  }
});
