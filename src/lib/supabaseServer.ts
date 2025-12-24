import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

/**
 * Creates a Supabase client for server-side operations with cookie-based session management.
 * This should be used in Astro pages, API routes, and middleware.
 * 
 * @param cookies - Astro cookies object from the request context
 * @param request - Astro request object (for reading cookies from headers)
 * @returns A Supabase client configured for SSR
 */
export const createSupabaseServerClient = (cookies: AstroCookies, request?: Request) => {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Try to get cookie from Astro cookies first
          const cookie = cookies.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies.set(name, value, {
            ...options,
            path: options.path ?? '/',
            sameSite: (options.sameSite as 'strict' | 'lax' | 'none') ?? 'lax',
            secure: options.secure ?? true,
            httpOnly: options.httpOnly ?? true,
          });
        },
        remove(name: string, options: CookieOptions) {
          cookies.delete(name, {
            ...options,
            path: options.path ?? '/',
          });
        },
      },
    }
  );
}

/**
 * Legacy export for backward compatibility.
 * @deprecated Use createSupabaseServerClient instead.
 */
export const supabaseServer = () => {
  throw new Error('supabaseServer() is deprecated. Use createSupabaseServerClient(cookies) instead.')
}