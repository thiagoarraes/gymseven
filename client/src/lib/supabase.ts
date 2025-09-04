import { createClient } from '@supabase/supabase-js';

// Try to get from Vite env first, then fallback to manual values
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback: if env vars are not loaded, use hardcoded values temporarily  
if (!supabaseUrl) {
  supabaseUrl = 'https://vlqzjrwxqeyroqsglqwr.supabase.co';
  console.log('⚠️ Using fallback SUPABASE_URL');
}

if (!supabaseAnonKey) {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscXpqcnd4cWV5cm9xc2dscXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUwNTksImV4cCI6MjA3MDA4MTA1OX0.b5NF57P-IoFu67IuHyi4bpD9VZJ-XCZSo5oEW0okK5c';
  console.log('⚠️ Using fallback SUPABASE_ANON_KEY');
}

console.log('🔍 Frontend Environment Check:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING');
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credenciais do Supabase não encontradas:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Credenciais do Supabase não encontradas. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client for frontend (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'gymseven-frontend'
    }
  }
});

console.log('✅ Supabase frontend client inicializado');