import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create Supabase client if credentials are available
export let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  // Create Supabase client for backend (uses service role key)
  supabase = createClient(supabaseUrl, supabaseKey, {
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

  console.log('✅ Supabase backend client inicializado');
  console.log(`🔗 URL: ${supabaseUrl}`);
} else {
  console.log('⚠️ Supabase credentials not configured, skipping Supabase client initialization');
}