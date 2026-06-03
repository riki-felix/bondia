import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Un solo cliente por proceso SSR (evita recrearlo en Layout + página). */
let cached: SupabaseClient | null = null;

export const supabaseClient = (): SupabaseClient => {
  if (cached) return cached;

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing PUBLIC_SUPABASE_URL environment variable");
  }
  if (!supabaseAnonKey) {
    throw new Error("Missing PUBLIC_SUPABASE_ANON_KEY environment variable");
  }

  cached = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
};