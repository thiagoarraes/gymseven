#!/usr/bin/env node

/**
 * GymSeven - Script de Setup Completo
 * Verifica credenciais e exibe instruções de configuração
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('⚙️  Configurando GymSeven...\n');

// Verificar credenciais
const checkProcess = spawn('node', [join(__dirname, 'check-secrets.js')], {
  stdio: 'inherit'
});

checkProcess.on('close', (code) => {
  if (code !== 0) {
    console.log('\n📋 Próximos passos:');
    console.log('   1. Configure as credenciais faltando no Replit Secrets');
    console.log('   2. Execute: npm run setup (para verificar novamente)');
    console.log('   3. Execute: npm run dev (para iniciar o app)');
    console.log('\n💡 Dica: Consulte o arquivo .env.example para referência');
    process.exit(1);
  }

  // Se chegou aqui, está tudo configurado
  console.log('🎉 GymSeven configurado com sucesso!');
  console.log('\n📋 Comandos disponíveis:');
  console.log('   • npm run setup      → Verificar configuração');
  console.log('   • npm run dev        → Iniciar app (com verificação)');
  console.log('   • npm run dev-unsafe → Iniciar app (sem verificação)');
  console.log('\n🚀 Para iniciar: npm run dev');
  process.exit(0);
});