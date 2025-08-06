#!/usr/bin/env tsx
// Script to test Supabase integration from command line
import { runSupabaseHealthCheck } from '../server/supabase-test';

async function main() {
  console.log('🚀 GymSeven Supabase Integration Test');
  console.log('====================================');
  console.log();

  try {
    const results = await runSupabaseHealthCheck();
    
    if (results.success) {
      console.log();
      console.log('🎉 SUCCESS: Supabase integration is fully functional!');
      console.log();
      console.log('Next steps:');
      console.log('1. Your app is ready to use with Supabase');
      console.log('2. You can view your data at: https://supabase.com/dashboard/projects');
      console.log('3. All CRUD operations are working correctly');
      
      process.exit(0);
    } else {
      console.log();
      console.log('❌ FAILED: Some integration tests failed');
      console.log();
      console.log('Common solutions:');
      console.log('1. Check your DATABASE_URL in Secrets');
      console.log('2. Ensure you are using "Transaction pooler" connection string');
      console.log('3. Replace [YOUR-PASSWORD] with your actual Supabase password');
      console.log('4. Run: npm run db:push');
      
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Test script failed:', error.message || error);
    process.exit(1);
  }
}

main();