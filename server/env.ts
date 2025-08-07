import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Simple .env file loader
export function loadEnv() {
  const envPath = join(process.cwd(), '.env');
  
  if (existsSync(envPath)) {
    try {
      const envFile = readFileSync(envPath, 'utf-8');
      const lines = envFile.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=');
            // Only set if not already in environment (Replit secrets take precedence)
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = value.trim();
            }
          }
        }
      }
      console.log('✅ Environment variables loaded from .env file');
    } catch (error) {
      console.log('⚠️ Could not load .env file:', error);
    }
  } else {
    console.log('📝 No .env file found, using environment variables only');
  }
}