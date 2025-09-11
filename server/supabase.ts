import { createClient } from '@supabase/supabase-js';

if (!process.env.VITE_SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL must be set');
}

if (!process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY must be set');
}

// Create Supabase client for server-side auth
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,   // No localStorage in Node.js server
      autoRefreshToken: false, // Handle tokens manually on server
    }
  }
);