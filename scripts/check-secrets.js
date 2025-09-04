#!/usr/bin/env node

/**
 * GymSeven - Script de Verificação de Credenciais
 * Verifica se todas as variáveis de ambiente necessárias estão configuradas
 */

console.log('🔍 Verificando credenciais do GymSeven...\n');

// Lista de credenciais obrigatórias
const requiredSecrets = [
  {
    key: 'SUPABASE_URL',
    description: 'URL do projeto Supabase',
    example: 'https://your-project.supabase.co'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY', 
    description: 'Chave de serviço Supabase (service_role)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    key: 'SUPABASE_ANON_KEY',
    description: 'Chave pública Supabase (anon key)', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
];

// Credenciais opcionais
const optionalSecrets = [
  'STRIPE_SECRET_KEY',
  'TWILIO_ACCOUNT_SID', 
  'TWILIO_AUTH_TOKEN',
  'OPENAI_API_KEY'
];

// Verificar credenciais obrigatórias
const missingRequired = [];
const configuredRequired = [];

requiredSecrets.forEach(secret => {
  const value = process.env[secret.key];
  if (!value || value.includes('your_') || value.includes('_here')) {
    missingRequired.push(secret);
  } else {
    configuredRequired.push(secret);
  }
});

// Verificar credenciais opcionais
const configuredOptional = [];
optionalSecrets.forEach(key => {
  if (process.env[key]) {
    configuredOptional.push(key);
  }
});

// Exibir resultados
console.log('📋 Status das Credenciais:\n');

if (configuredRequired.length > 0) {
  console.log('✅ Credenciais Obrigatórias Configuradas:');
  configuredRequired.forEach(secret => {
    const value = process.env[secret.key];
    const masked = value.length > 10 ? 
      value.substring(0, 8) + '...' + value.substring(value.length - 4) :
      '***';
    console.log(`   ✓ ${secret.key}: ${masked}`);
  });
  console.log('');
}

if (missingRequired.length > 0) {
  console.log('❌ Credenciais Obrigatórias Faltando:');
  missingRequired.forEach(secret => {
    console.log(`   ✗ ${secret.key}`);
    console.log(`     ${secret.description}`);
    console.log(`     Exemplo: ${secret.example}`);
    console.log('');
  });
  
  console.log('🔧 Como corrigir:');
  console.log('   1. Abrir: Tools > Secrets (no painel lateral)');
  console.log('   2. Adicionar cada credencial faltando');
  console.log('   3. Executar novamente: npm run setup');
  console.log('');
  process.exit(1);
}

if (configuredOptional.length > 0) {
  console.log('🔹 Credenciais Opcionais Configuradas:');
  configuredOptional.forEach(key => {
    console.log(`   ◦ ${key}: configurado`);
  });
  console.log('');
}

// Validar formato das credenciais Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

let hasFormatErrors = false;

if (supabaseUrl && !supabaseUrl.startsWith('https://') && !supabaseUrl.includes('.supabase.co')) {
  console.log('⚠️  SUPABASE_URL não parece válida (deve ser https://...supabase.co)');
  hasFormatErrors = true;
}

if (serviceKey && (!serviceKey.startsWith('eyJ') || serviceKey.length < 100)) {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY não parece válida (deve começar com eyJ)');
  hasFormatErrors = true;
}

if (anonKey && (!anonKey.startsWith('eyJ') || anonKey.length < 100)) {
  console.log('⚠️  SUPABASE_ANON_KEY não parece válida (deve começar com eyJ)');
  hasFormatErrors = true;
}

if (hasFormatErrors) {
  console.log('\n🔧 Verifique se copiou as credenciais corretamente do Supabase Dashboard');
  process.exit(1);
}

// Tudo ok!
console.log('✅ Todas as credenciais obrigatórias estão configuradas!');
console.log('🚀 App pronto para executar\n');

process.exit(0);