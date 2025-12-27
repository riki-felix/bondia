/** 
 * Handles authentication sign-in with OTP (Magic Link).
 */
import { supabase } from './supabaseClient.js'; 

/** Sends magic link to the provided email */
export async function sendMagicLink(email) {
  try {
	const redirectTo = `${import.meta.env.PUBLIC_SITE_URL}/auth/callback`;
	const { data, error } = await supabase.auth.signInWithOtp({
	  email,
	  options: { redirectTo },
	});

	if (error) {
	  console.error('Error sending magic link email:', error.message);
	  return { success: false, message: error.message };
	}

	console.log('Magic link sent successfully:', data);
	return { success: true, message: 'Magic link sent successfully!' };
  } catch (e) {
	console.error('Unexpected error:', e.message);
	return { success: false, message: 'An unexpected error occurred.' };
  }
}