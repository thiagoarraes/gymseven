#!/usr/bin/env node

/**
 * GymSeven - Script de Inicialização Segura
 * Verifica credenciais antes de iniciar o app
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🚀 Iniciando GymSeven...\n');

// Primeiro, verificar credenciais
const checkProcess = spawn('node', [join(__dirname, 'check-secrets.js')], {
  stdio: 'inherit'
});

checkProcess.on('close', (code) => {
  if (code !== 0) {
    console.log('\n❌ Não é possível iniciar o app sem as credenciais necessárias.');
    console.log('Configure as credenciais e tente novamente.');
    process.exit(1);
  }

  // Se chegou aqui, credenciais estão ok
  console.log('🎯 Iniciando servidor de desenvolvimento...\n');
  
  // Iniciar o servidor
  const serverProcess = spawn('tsx', ['server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  serverProcess.on('close', (code) => {
    process.exit(code);
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
  });
});