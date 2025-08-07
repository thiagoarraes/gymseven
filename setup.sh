#!/bin/bash

# GymSeven - Configuração Automática para Replit
echo "🚀 Configurando GymSeven para Replit..."

# Verificar se Node.js está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando..."
    exit 1
fi

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install --no-optional --no-audit --prefer-offline
    
    # Se falhar, tentar com cache limpo
    if [ $? -ne 0 ]; then
        echo "⚠️ Primeira tentativa falhou. Limpando cache e tentando novamente..."
        npm cache clean --force
        npm install --no-optional --no-audit
    fi
fi

# Verificar se tsx está disponível
if [ ! -f "node_modules/.bin/tsx" ]; then
    echo "🔧 Configurando tsx..."
    mkdir -p node_modules/.bin
    echo '#!/bin/bash' > node_modules/.bin/tsx
    echo 'exec npx tsx "$@"' >> node_modules/.bin/tsx
    chmod +x node_modules/.bin/tsx
fi

# Verificar se as credenciais do Supabase estão configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️ Credenciais do Supabase não configuradas."
    echo "💡 Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nos Replit Secrets"
    echo "   para conectar ao banco de dados."
fi

echo "✅ Configuração concluída! Iniciando aplicação..."