import { createClient } from '@supabase/supabase-js';

// Create Supabase client factory function
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'X-Client-Info': 'gymseven-backend'
      }
    }
  });
}

// Lazy initialization - client will be created when first accessed
let _supabase: any = null;

export function getSupabaseClient() {
  if (!_supabase) {
    try {
      _supabase = createSupabaseClient();
      console.log('✅ Supabase backend client inicializado');
      console.log(`🔗 URL: ${process.env.SUPABASE_URL}`);
    } catch (error) {
      console.log('⚠️ Supabase credentials not configured, skipping Supabase client initialization');
      return null;
    }
  }
  return _supabase;
}

// Export for backward compatibility - only initialize when needed
export const supabase = getSupabaseClient(); // Initialize immediately