import { defineMiddleware } from 'astro/middleware';
import { createSupabaseServerClient } from './lib/supabaseServer';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;

  const isAllowlisted = (p) => {
    if (p === '/login') return true;
    if (p.startsWith('/auth/callback')) return true;
    if (p.startsWith('/well-known')) {
      console.warn(`Allowlisted path intercepted: "${p}"`);
      return true;
    }
    return false;
  };

  if (isAllowlisted(path)) return next();

  const supabase = createSupabaseServerClient(ctx.cookies, ctx.request);
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Error fetching session:", error.message);
  }

  if (!session) {
    const safePath = path && typeof path === 'string' ? encodeURIComponent(path) : '/';
    console.warn(`Redirecting to login, invalid path: "${safePath}"`);
    return Response.redirect(`/login?redirect=${safePath}&error=Please log in to access this page.`);
  }

  ctx.locals.user = session.user;
  return next();
});