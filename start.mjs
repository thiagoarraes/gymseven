#!/usr/bin/env node

/**
 * GymSeven - Script de inicialização robusto para Replit
 * Este script garante que o aplicativo funcione em qualquer conta do Replit
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';

console.log('🚀 Iniciando GymSeven...');

// Verificar Node.js
console.log(`📋 Node.js versão: ${process.version}`);

// Função para executar comandos de forma segura
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Executando: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Configurar node_modules/.bin/tsx se não existir
function setupTsx() {
  const binDir = './node_modules/.bin';
  const tsxPath = join(binDir, 'tsx');
  
  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true });
  }
  
  if (!existsSync(tsxPath)) {
    console.log('🔧 Configurando tsx wrapper...');
    writeFileSync(tsxPath, `#!/bin/bash\nexec npx tsx "$@"\n`);
    chmodSync(tsxPath, 0o755);
  }
}

// Instalar dependências se necessário
async function installDependencies() {
  if (!existsSync('./node_modules')) {
    console.log('📦 Instalando dependências...');
    try {
      await runCommand('npm', ['ci', '--no-audit', '--prefer-offline']);
    } catch (error) {
      console.log('⚠️ npm ci falhou, tentando npm install...');
      try {
        await runCommand('npm', ['install', '--no-audit', '--prefer-offline']);
      } catch (installError) {
        console.log('❌ Falha na instalação automática');
        console.log('💡 Tente executar manualmente: npm install');
        throw installError;
      }
    }
  } else {
    console.log('✅ Dependencies já instaladas');
  }
}

// Verificar credenciais Supabase
function checkSupabaseCredentials() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ ATENÇÃO: Credenciais Supabase não configuradas');
    console.log('💡 Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nos Replit Secrets');
    console.log('📖 Veja README.md para instruções detalhadas');
    console.log('🔄 O app funcionará com dados temporários até configurar o Supabase');
  } else {
    console.log('✅ Credenciais Supabase encontradas');
  }
}

// Iniciar aplicação
async function startApp() {
  console.log('🚀 Iniciando servidor...');
  
  // Usar npx tsx diretamente para máxima compatibilidade
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`🔄 Servidor parou com código ${code}`);
    process.exit(code);
  });
  
  // Capturar sinais para cleanup
  process.on('SIGTERM', () => {
    console.log('🛑 Parando servidor...');
    serverProcess.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Parando servidor...');
    serverProcess.kill('SIGINT');
  });
}

// Execução principal
async function main() {
  try {
    console.log('🔍 Verificando ambiente...');
    
    setupTsx();
    await installDependencies();
    checkSupabaseCredentials();
    
    console.log('✅ Ambiente configurado com sucesso!');
    
    await startApp();
    
  } catch (error) {
    console.error('❌ Erro durante inicialização:', error.message);
    console.log('💡 Tente executar ./setup.sh ou npm install manualmente');
    process.exit(1);
  }
}

main();