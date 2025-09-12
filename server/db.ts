import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Force use of Supabase database exclusively  
const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set for database connection. Check your Supabase configuration.",
  );
}

console.log('🔍 [DATABASE] Using database:', databaseUrl.substring(0, 30) + '...');

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
