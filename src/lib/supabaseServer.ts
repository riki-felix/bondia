import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

/**
 * Creates a Supabase client for server-side operations with cookie-based session management.
 * This should be used in Astro pages, API routes, and middleware.
 * 
 * @param cookies - Astro cookies object from the request context
 * @param request - Astro request object (optional, for reading cookies from headers)
 * @returns A Supabase client configured for SSR
 */
export const createSupabaseServerClient = (cookies: AstroCookies, request?: Request) => {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // If we have the request, parse cookies from headers
          if (request) {
            const cookieHeader = request.headers.get('cookie') ?? '';
            return parseCookieHeader(cookieHeader);
          }
          // Fallback: return empty array (cookies will be set on first auth action)
          return [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options as any)
          })
        }
      }
    }
  )
}

/**
 * Legacy export for backward compatibility.
 * @deprecated Use createSupabaseServerClient instead.
 */
export const supabaseServer = () => {
  throw new Error('supabaseServer() is deprecated. Use createSupabaseServerClient(cookies) instead.')
}