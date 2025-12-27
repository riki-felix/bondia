import { defineMiddleware } from 'astro/middleware';
import { createSupabaseServerClient } from './lib/supabaseServer';

export const onRequest = defineMiddleware(async (ctx, next) => {
  // Enhanced safety check for path value
  const path = ctx.url?.pathname;
  
  if (!path || typeof path !== 'string') {
    console.error('[Middleware] Invalid path value:', path);
    return Response.redirect(new URL('/login?error=Invalid request path', ctx.url.origin).href);
  }

  /**
   * Check if a path should be allowed without authentication
   */
  const isAllowlisted = (p: string) => {
    // Authentication and public pages
    if (p === '/login') return true;
    if (p === '/auth/callback') return true;
    
    // Static assets and build artifacts
    if (p.startsWith('/_astro/')) return true;
    if (p.startsWith('/favicon.ico')) return true;
    if (p.startsWith('/robots.txt')) return true;
    if (p.startsWith('/.well-known/')) return true;
    
    // API endpoints that handle their own auth
    if (p.startsWith('/api/auth/')) return true;
    
    return false;
  };

  // Allow access to public paths without authentication
  if (isAllowlisted(path)) {
    console.log(`[Middleware] Allowing access to allowlisted path: "${path}"`);
    return next();
  }

  // Attempt to retrieve session
  try {
    const supabase = createSupabaseServerClient(ctx.cookies, ctx.request);
    const { data: { session }, error } = await supabase.auth.getSession();

    // Log session retrieval errors
    if (error) {
      console.error('[Middleware] Error fetching session:', error.message);
      const safePath = encodeURIComponent(path);
      const errorMessage = encodeURIComponent('Session validation failed. Please log in again.');
      return Response.redirect(new URL(`/login?redirect=${safePath}&error=${errorMessage}`, ctx.url.origin).href);
    }

    // Handle unauthenticated access
    if (!session) {
      console.warn(`[Middleware] Unauthenticated access attempt to: "${path}"`);
      const safePath = encodeURIComponent(path);
      const errorMessage = encodeURIComponent('Please log in to access this page.');
      return Response.redirect(new URL(`/login?redirect=${safePath}&error=${errorMessage}`, ctx.url.origin).href);
    }

    // Valid session - attach user to context and continue
    console.log(`[Middleware] Authenticated user accessing: "${path}"`);
    ctx.locals.user = session.user;
    return next();
  } catch (err) {
    // Handle unexpected server errors
    console.error('[Middleware] Unexpected server error:', err);
    const safePath = encodeURIComponent(path);
    const errorMessage = encodeURIComponent('An unexpected error occurred. Please try again.');
    return Response.redirect(new URL(`/login?redirect=${safePath}&error=${errorMessage}`, ctx.url.origin).href);
  }
});