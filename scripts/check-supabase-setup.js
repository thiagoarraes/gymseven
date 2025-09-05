#!/usr/bin/env node

console.log('🔍 Verificando configuração do Supabase...\n');

// Verifica se as credenciais do Supabase estão configuradas
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY', 
  'SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('❌ CONFIGURAÇÃO INCOMPLETA DO SUPABASE\n');
  console.log('Para usar este projeto, você precisa configurar as seguintes credenciais do Supabase:\n');
  
  missingVars.forEach(varName => {
    console.log(`   🔑 ${varName}`);
  });
  
  console.log('\n📋 COMO OBTER AS CREDENCIAIS:');
  console.log('1. Acesse: https://supabase.com/dashboard');
  console.log('2. Selecione seu projeto (ou crie um novo)');
  console.log('3. Vá em Settings > API');
  console.log('4. Copie as seguintes informações:');
  console.log('   • Project URL (SUPABASE_URL)');
  console.log('   • anon/public key (SUPABASE_ANON_KEY)');
  console.log('   • service_role key (SUPABASE_SERVICE_ROLE_KEY)');
  
  console.log('\n🔧 COMO CONFIGURAR NO REPLIT:');
  console.log('1. Abra a aba "Secrets" no painel lateral');
  console.log('2. Adicione cada credencial com o nome exato mostrado acima');
  console.log('3. Reinicie o projeto após adicionar todas as credenciais');
  
  console.log('\n⚠️  O servidor não será iniciado sem essas configurações.\n');
  
  process.exit(1);
}

console.log('✅ Todas as credenciais do Supabase foram encontradas!');
console.log('🚀 Iniciando o servidor...\n');