#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('🔧 Fixing rollup native dependency...');

// Create the @rollup directory if it doesn't exist
const rollupDir = './node_modules/@rollup';
if (!existsSync(rollupDir)) {
  mkdirSync(rollupDir, { recursive: true });
  console.log('📁 Created @rollup directory');
}

// Function to run command
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_optional: 'true'
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Try to specifically install the missing rollup dependency
async function fixRollup() {
  try {
    console.log('🔧 Installing @rollup/rollup-linux-x64-gnu...');
    await runCommand('npm', ['install', '@rollup/rollup-linux-x64-gnu', '--no-package-lock', '--force']);
    console.log('✅ Successfully installed rollup native dependency');
  } catch (error) {
    console.log('⚠️ Direct install failed, trying alternative approach...');
    try {
      // Try to force reinstall rollup
      await runCommand('npm', ['install', 'rollup', '--no-package-lock', '--force']);
      console.log('✅ Reinstalled rollup successfully');
    } catch (rollupError) {
      console.log('❌ Failed to fix rollup dependency');
      console.log('💡 Manual fix needed - check npm/node version compatibility');
      throw rollupError;
    }
  }
}

fixRollup().catch(error => {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
});