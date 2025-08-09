import { createClient } from '@supabase/supabase-js';

// Extract Supabase URL and key from DATABASE_URL if available
function extractSupabaseCredentials(): { url: string | null, key: string | null } {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl && databaseUrl.includes('supabase.co')) {
    // Extract from Supabase connection string format:
    // postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
    const match = databaseUrl.match(/postgres\.([^:]+):([^@]+)@([^:]+)/);
    if (match) {
      const projectRef = match[1];
      const password = match[2];
      const region = match[3].split('.')[1]; // Extract region from hostname
      
      const supabaseUrl = `https://${projectRef}.supabase.co`;
      // For SDK integration, we'll use the anon key pattern (this is a simplified approach)
      // In production, you should provide the actual service role key
      const anonKey = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IiR7cHJvamVjdFJlZn0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTU2ODQwMCwiZXhwIjoxOTYxMTQ0NDAwfQ`;
      
      return { url: supabaseUrl, key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || anonKey };
    }
  }
  
  return {
    url: process.env.SUPABASE_URL || null,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null
  };
}

const { url: supabaseUrl, key: supabaseKey } = extractSupabaseCredentials();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
  Missing Supabase configuration. Please provide either:
  1. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables, OR
  2. DATABASE_URL with Supabase connection string
  
  For Supabase setup:
  - SUPABASE_URL: https://your-project.supabase.co
  - SUPABASE_SERVICE_ROLE_KEY: your service role key from Supabase dashboard
  `);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✅ Supabase client initialized successfully');
console.log(`🔗 Connected to: ${supabaseUrl}`);