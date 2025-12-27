import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabaseServer';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
];

// Patterns for static assets and development resources
const STATIC_PATTERNS = [
  /^\/_astro\//,
  /^\/assets\//,
  /^\/favicon\./,
  /^\/images\//,
  /^\/scripts\//,
  /^\/styles\//,
  /^\/@vite\//,
  /^\/@fs\//,
  /^\/node_modules\//,
];

export const onRequest = defineMiddleware(async ({ url, cookies, request, redirect }, next) => {
  const pathname = url.pathname;

  // Allow static assets
  if (STATIC_PATTERNS.some(pattern => pattern.test(pathname))) {
    return next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return next();
  }

  // Check authentication for all other routes
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    // Redirect to login with error message
    const loginUrl = new URL('/login', url.origin);
    if (!session) {
      loginUrl.searchParams.set('error', 'auth_required');
    }
    return redirect(loginUrl.toString());
  }

  // User is authenticated, proceed
  return next();
});
