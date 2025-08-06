// Utility to check if connection is to Supabase and provide helpful info
export function checkSupabaseConnection(): {
  isSupabase: boolean;
  provider: 'supabase' | 'neon' | 'postgres' | 'unknown';
  recommendations: string[];
} {
  const connectionString = process.env.DATABASE_URL || '';
  
  let provider: 'supabase' | 'neon' | 'postgres' | 'unknown' = 'unknown';
  let recommendations: string[] = [];
  
  if (connectionString.includes('supabase.com')) {
    provider = 'supabase';
    recommendations = [
      'Using Supabase - excellent choice for production!',
      'SSL is automatically configured for Supabase connections',
      'Connection pooling is optimized for Supabase',
      'You can view your data at: https://supabase.com/dashboard/projects'
    ];
  } else if (connectionString.includes('neon.tech')) {
    provider = 'neon';
    recommendations = [
      'Using Neon - good choice for development and production',
      'Connection pooling is configured for optimal performance'
    ];
  } else if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
    provider = 'postgres';
    recommendations = [
      'Using PostgreSQL - fully compatible with the application',
      'Make sure your database supports the required features'
    ];
  }
  
  return {
    isSupabase: provider === 'supabase',
    provider,
    recommendations
  };
}

export function logDatabaseInfo() {
  const info = checkSupabaseConnection();
  console.log(`🗄️  Database Provider: ${info.provider}`);
  info.recommendations.forEach(rec => console.log(`   ℹ️  ${rec}`));
}