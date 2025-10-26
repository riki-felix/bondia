import { createClient } from '@supabase/supabase-js'

// Cliente que usarás en SSR (Netlify Functions o Astro middleware)
export const supabaseServer = () =>
  createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
  )