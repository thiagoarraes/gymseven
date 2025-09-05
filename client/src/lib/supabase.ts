import { createClient } from '@supabase/supabase-js';

// Try environment variables first (development)
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If environment variables are not available, try to fetch from API (production)
let supabaseClient: any = null;

async function initializeSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      console.log('🔄 Fetching Supabase config from API...');
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        supabaseUrl = config.supabaseUrl;
        supabaseAnonKey = config.supabaseAnonKey;
        console.log('✅ Supabase config loaded from API');
      } else {
        throw new Error('Failed to fetch config from API');
      }
    } catch (error) {
      console.error('❌ Failed to fetch Supabase config:', error);
      throw new Error('Supabase configuration not available');
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables missing');
    throw new Error('Supabase URL and Anon Key are required');
  }

  // Create Supabase client
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage
    }
  });

  console.log('✅ Supabase client initialized with config');
  return supabaseClient;
}

// Export a promise that resolves to the initialized client
export const supabasePromise = initializeSupabase();

// Export client for immediate use (will be null until initialized)
export let supabase: any = null;

// Initialize immediately if we have env vars (development)
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage
    }
  });
  console.log('✅ Supabase client initialized with direct config');
} else {
  // For production, initialize async and update the export
  supabasePromise.then(client => {
    supabase = client;
  });
}