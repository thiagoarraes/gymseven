// Utility to test Supabase integration
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { exercises } from '@shared/schema';
import { checkSupabaseConnection } from './supabase-check';
import { eq } from 'drizzle-orm';

export async function testSupabaseIntegration(): Promise<{
  success: boolean;
  provider: string;
  tests: Array<{ name: string; passed: boolean; error?: string }>;
}> {
  const results = {
    success: true,
    provider: 'unknown',
    tests: [] as Array<{ name: string; passed: boolean; error?: string }>
  };

  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      results.tests.push({ name: 'DATABASE_URL Check', passed: false, error: 'DATABASE_URL not found' });
      results.success = false;
      return results;
    }

    // Detect provider
    const info = checkSupabaseConnection();
    results.provider = info.provider;
    results.tests.push({ name: 'Provider Detection', passed: true });

    // Test connection
    const isSupabase = connectionString.includes('supabase.com');
    const pool = new Pool({
      connectionString,
      ssl: (isSupabase || connectionString.includes('neon.tech')) ? { rejectUnauthorized: false } : false,
      max: 5,
      connectionTimeoutMillis: 10000,
    });

    const db = drizzle(pool);

    // Test 1: Basic connection
    try {
      await db.execute('SELECT 1 as test');
      results.tests.push({ name: 'Basic Connection', passed: true });
    } catch (error: any) {
      results.tests.push({ name: 'Basic Connection', passed: false, error: error.message || error });
      results.success = false;
    }

    // Test 2: Table existence
    try {
      await db.select().from(exercises).limit(1);
      results.tests.push({ name: 'Exercises Table', passed: true });
    } catch (error: any) {
      results.tests.push({ name: 'Exercises Table', passed: false, error: 'Table may not exist or need migration' });
      results.success = false;
    }

    // Test 3: Insert capability
    try {
      const testExercise = {
        name: 'Test Exercise - ' + Date.now(),
        muscleGroup: 'Test',
        description: 'Test exercise for connection verification',
        imageUrl: null,
        videoUrl: null,
      };

      const inserted = await db.insert(exercises).values(testExercise).returning();
      
      if (inserted.length > 0) {
        results.tests.push({ name: 'Insert Operation', passed: true });
        
        // Clean up test data
        await db.delete(exercises).where(eq(exercises.id, inserted[0].id));
      } else {
        results.tests.push({ name: 'Insert Operation', passed: false, error: 'No data returned from insert' });
        results.success = false;
      }
    } catch (error: any) {
      results.tests.push({ name: 'Insert Operation', passed: false, error: error.message || error });
      results.success = false;
    }

    await pool.end();

  } catch (error: any) {
    results.tests.push({ name: 'Overall Test', passed: false, error: error.message || error });
    results.success = false;
  }

  return results;
}

export async function runSupabaseHealthCheck() {
  console.log('🔍 Running Supabase Integration Health Check...');
  console.log('================================================');
  
  const results = await testSupabaseIntegration();
  
  console.log(`🗄️  Provider: ${results.provider.toUpperCase()}`);
  console.log(`✅ Overall Status: ${results.success ? 'PASSED' : 'FAILED'}`);
  console.log();
  
  results.tests.forEach((test, index) => {
    const icon = test.passed ? '✅' : '❌';
    const status = test.passed ? 'PASS' : 'FAIL';
    console.log(`${icon} Test ${index + 1}: ${test.name} - ${status}`);
    
    if (!test.passed && test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  console.log();
  
  if (results.success) {
    console.log('🎉 All integration tests passed! Supabase is fully functional.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    
    if (results.provider === 'unknown') {
      console.log();
      console.log('🔧 Troubleshooting steps:');
      console.log('1. Verify DATABASE_URL is set correctly');
      console.log('2. For Supabase: Use "Transaction pooler" connection string');
      console.log('3. Ensure [YOUR-PASSWORD] is replaced with actual password');
      console.log('4. Check if your database project is active');
      console.log('5. Run "npm run db:push" to ensure tables exist');
    }
  }
  
  return results;
}