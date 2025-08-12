#!/usr/bin/env node

// Script para build da aplicação para Netlify
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build para Netlify...');

try {
  // 1. Build do frontend com Vite
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  // 2. Verificar se o build foi criado
  const buildPath = path.join(process.cwd(), 'dist', 'public');
  if (!fs.existsSync(buildPath)) {
    throw new Error('Build folder not found');
  }
  
  // 3. Verificar se a função serverless existe
  const functionPath = path.join(process.cwd(), 'netlify', 'functions', 'api.js');
  if (!fs.existsSync(functionPath)) {
    throw new Error('Netlify function not found');
  }
  
  console.log('✅ Build concluído com sucesso!');
  console.log(`📁 Frontend: ${buildPath}`);
  console.log(`⚡ Function: ${functionPath}`);
  
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  process.exit(1);
}