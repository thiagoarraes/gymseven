#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';

console.log('📦 Installing packages manually...');

// Check if we can install packages
const installCommand = spawn('npm', ['install', '--no-package-lock'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

installCommand.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Package installation completed');
    process.exit(0);
  } else {
    console.log('❌ Package installation failed with code:', code);
    console.log('🔧 Trying alternative approach...');
    
    // Create minimal package structure
    if (!fs.existsSync('node_modules')) {
      fs.mkdirSync('node_modules');
    }
    
    console.log('📁 Created basic node_modules structure');
    process.exit(1);
  }
});

installCommand.on('error', (error) => {
  console.log('❌ Installation error:', error.message);
  process.exit(1);
});