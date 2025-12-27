/** 
 * Modularized authentication handler for Supabase Magic Links.
 * Supports both development (localhost) and production environments.
 */
import { supabase } from './supabaseClient.js';

/**
 * Determines the appropriate redirect URL based on the current environment.
 * @returns {string} The callback URL for magic link authentication
 */
function getRedirectUrl() {
  // Use environment variable if explicitly set
  if (import.meta.env.PUBLIC_SITE_URL) {
    return `${import.meta.env.PUBLIC_SITE_URL}/auth/callback`;
  }
  
  // Fallback to current origin for robustness
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  
  // Default fallback (should not reach here in browser context)
  return '/auth/callback';
}

/**
 * Sends a magic link to the provided email address.
 * @param {string} email - The user's email address
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export async function sendMagicLink(email) {
  try {
    if (!email || typeof email !== 'string') {
      return { success: false, message: 'Invalid email address provided.' };
    }

    const redirectTo = getRedirectUrl();
    console.log('[Auth] Sending magic link with redirect URL:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error('[Auth] Error sending magic link:', error.message);
      return { success: false, message: error.message };
    }

    console.log('[Auth] Magic link sent successfully:', data);
    return { success: true, message: 'Magic link sent successfully!' };
  } catch (e) {
    console.error('[Auth] Unexpected error:', e);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

/**
 * Validates an email address format.
 * @param {string} email - The email to validate
 * @returns {boolean} True if the email format is valid
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
