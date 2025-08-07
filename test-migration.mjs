#!/usr/bin/env node

/**
 * Script de teste para verificar se a migração foi bem-sucedida
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

console.log('🧪 Testando migração do GymSeven...');

// Verificações básicas
function checkBasicSetup() {
  console.log('🔍 Verificando configuração básica...');
  
  const checks = [
    { file: './package.json', name: 'package.json' },
    { file: './server/index.ts', name: 'servidor principal' },
    { file: './client/src/App.tsx', name: 'frontend React' },
    { file: './shared/schema.ts', name: 'esquemas compartilhados' },
    { file: './node_modules', name: 'dependências instaladas' },
    { file: './setup-replit.mjs', name: 'script de configuração' },
    { file: './README_REPLIT.md', name: 'documentação Replit' }
  ];
  
  let allChecked = true;
  for (const check of checks) {
    if (existsSync(check.file)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - FALTANDO`);
      allChecked = false;
    }
  }
  
  return allChecked;
}

// Verificar credenciais
function checkCredentials() {
  console.log('🔐 Verificando credenciais...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    console.log('✅ Credenciais Supabase configuradas');
    return true;
  } else {
    console.log('⚠️ Credenciais Supabase não configuradas');
    console.log('💡 Configure nos Replit Secrets:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }
}

// Verificar dependências críticas
function checkDependencies() {
  console.log('📦 Verificando dependências críticas...');
  
  const criticalDeps = [
    './node_modules/tsx',
    './node_modules/@rollup/rollup-linux-x64-gnu',
    './node_modules/vite',
    './node_modules/express',
    './node_modules/react'
  ];
  
  let allPresent = true;
  for (const dep of criticalDeps) {
    if (existsSync(dep)) {
      console.log(`✅ ${dep.split('/').pop()}`);
    } else {
      console.log(`❌ ${dep.split('/').pop()} - FALTANDO`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

// Teste de conexão Supabase
async function testSupabaseConnection() {
  console.log('🗄️ Testando conexão Supabase...');
  
  try {
    // Importar e testar conexão
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Credenciais não configuradas, pulando teste');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste simples de conexão
    const { data, error } = await supabase.from('exercises').select('count').limit(1);
    
    if (error) {
      console.log('⚠️ Conexão Supabase com problemas:', error.message);
      return false;
    } else {
      console.log('✅ Conexão Supabase funcionando');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Erro ao testar Supabase:', error.message);
    return false;
  }
}

// Execução principal
async function main() {
  console.log('🚀 Iniciando testes de migração...');
  console.log('');
  
  const basicOk = checkBasicSetup();
  console.log('');
  
  const credsOk = checkCredentials();
  console.log('');
  
  const depsOk = checkDependencies();
  console.log('');
  
  const supabaseOk = await testSupabaseConnection();
  console.log('');
  
  // Resumo final
  console.log('📋 RESUMO DA MIGRAÇÃO:');
  console.log('');
  console.log(`🗂️ Arquivos básicos: ${basicOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`🔐 Credenciais: ${credsOk ? '✅ OK' : '⚠️ CONFIGURE'}`);
  console.log(`📦 Dependências: ${depsOk ? '✅ OK' : '❌ PROBLEMAS'}`);
  console.log(`🗄️ Supabase: ${supabaseOk ? '✅ OK' : '⚠️ CONFIGURE'}`);
  console.log('');
  
  if (basicOk && depsOk) {
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('');
    console.log('🚀 Para iniciar o aplicativo:');
    console.log('   npm run dev');
    console.log('');
    
    if (!credsOk) {
      console.log('⚠️ LEMBRE-SE: Configure as credenciais Supabase para funcionalidade completa');
    }
  } else {
    console.log('❌ MIGRAÇÃO PRECISA DE CORREÇÕES');
    console.log('');
    console.log('🔧 Execute para corrigir:');
    console.log('   node setup-replit.mjs');
  }
}

main().catch(error => {
  console.error('❌ Erro durante teste:', error.message);
  process.exit(1);
});