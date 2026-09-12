/**
 * supabaseClient.js
 * Supabase client initialization with safety checks and environment fallback.
 * Prevents runtime crashes when environment variables are not yet provided.
 */

import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env?.VITE_SUPABASE_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;

// Check if credentials are provided and not dummy placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key' &&
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://')
);

if (!isSupabaseConfigured) {
  console.info(
    '%c[Supabase]%c Credentials not configured yet in .env / .env.local. Operating in graceful fallback mode.',
    'color: #2563eb; font-weight: bold;',
    'color: inherit;'
  );
}

// Export the active Supabase client or null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
