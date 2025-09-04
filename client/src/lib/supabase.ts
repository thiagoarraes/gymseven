import { createClient } from '@supabase/supabase-js';

// Direct Supabase configuration - no environment variables needed
const supabaseUrl = 'https://vlqzjrwxqeyroqsglqwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscXpqcnd4cWV5cm9xc2dscXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUwNTksImV4cCI6MjA3MDA4MTA1OX0.b5NF57P-IoFu67IuHyi4bpD9VZJ-XCZSo5oEW0okK5c';

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// Log successful initialization  
console.log('✅ Supabase client initialized with direct config');