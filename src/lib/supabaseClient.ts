import { createClient } from '@supabase/supabase-js'

export const supabaseClient = () => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  // Add validation
  if (!supabaseUrl) {
	throw new Error('Missing PUBLIC_SUPABASE_URL environment variable');
  }
  
  if (!supabaseAnonKey) {
	throw new Error('Missing PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  
  console.log('[supabaseClient] Creating client with URL:', supabaseUrl.substring(0, 30) + '...');
  
  return createClient(
	supabaseUrl,
	supabaseAnonKey,
	{
	  auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true
	  }
	}
  );
}