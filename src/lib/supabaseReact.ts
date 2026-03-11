// src/lib/supabaseReact.ts
// React-friendly wrapper around the Supabase client for use in React islands.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Get a singleton Supabase client for use in React components (browser-only). */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY");
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}
