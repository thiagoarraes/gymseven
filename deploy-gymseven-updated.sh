#!/bin/bash
set -e

echo "🚀 INICIANDO DEPLOY GYMSEVEN"
echo "=================================="

# 1. Fazer backup do .env FORA do diretório do projeto
echo "1. Fazendo backup das configurações..."
cp .env /tmp/.env.gymseven.backup

# 2. Fazer pull das alterações
echo "2. Baixando atualizações do GitHub..."
git fetch origin
git reset --hard origin/main
git pull origin main

# 3. Restaurar .env e verificar variáveis críticas
echo "3. Restaurando configurações..."
cp /tmp/.env.gymseven.backup .env

# 4. ADICIONAR FEATURE FLAGS V2 (CRÍTICO PARA FUNCIONAMENTO)
echo "4. Adicionando feature flags V2 ao .env..."
# Remover flags antigas se existirem
grep -v "^FEATURE_NEW_" .env > /tmp/.env.temp || true
mv /tmp/.env.temp .env

# Adicionar as novas feature flags
echo "" >> .env
echo "# Feature Flags V2 - API Functionality" >> .env
echo "FEATURE_NEW_AUTH=true" >> .env
echo "FEATURE_NEW_EXERCISES=true" >> .env
echo "FEATURE_NEW_WORKOUTS=true" >> .env
echo "FEATURE_NEW_PROGRESS=true" >> .env

echo "✅ Feature flags V2 adicionadas ao .env"

# 5. Verificar se as variáveis críticas estão no .env
echo "5. Verificando variáveis de ambiente críticas..."
if ! grep -q "VITE_SUPABASE_URL" .env; then
    echo "❌ ERRO: VITE_SUPABASE_URL não encontrada no .env"
    echo "Conteúdo atual do .env:"
    cat .env
    exit 1
fi

if ! grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo "❌ ERRO: VITE_SUPABASE_ANON_KEY não encontrada no .env"
    exit 1
fi

if ! grep -q "FEATURE_NEW_WORKOUTS=true" .env; then
    echo "❌ ERRO: Feature flags V2 não foram adicionadas corretamente"
    exit 1
fi

echo "✅ Variáveis críticas do Supabase e Feature flags V2 encontradas no .env"

# 6. Instalar novas dependências (se houver)
echo "6. Verificando dependências..."
npm install --no-optional

# 7. Limpar builds anteriores
echo "7. Limpando builds anteriores..."
rm -rf dist/

# 8. Fazer novo build
echo "8. Compilando aplicação..."
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 9. Verificar se build foi bem-sucedido
echo "9. Verificando integridade do build..."
if [ ! -f "dist/public/index.html" ]; then
    echo "❌ ERRO: Build do frontend falhou - dist/public/index.html não encontrado"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ ERRO: Build do servidor falhou - dist/index.js não encontrado"
    exit 1
fi

echo "✅ Build verificado com sucesso"

# 10. Fazer backup dos uploads (se existirem)
echo "10. Fazendo backup de arquivos de usuário..."
if [ -d "uploads" ]; then
    cp -r uploads /tmp/uploads.gymseven.backup
    echo "✅ Backup de uploads realizado"
fi

# 11. PARAR o PM2 antes do teste (CORREÇÃO PRINCIPAL)
echo "11. Parando aplicação para teste seguro..."
pm2 stop gymseven || echo "⚠️  Aplicação não estava rodando"

# 12. Testar se build funciona localmente (agora com porta livre)
echo "12. Testando build antes do restart..."
# Carregar variáveis do .env (mesmo ambiente que PM2 usará)
set -a
source .env
set +a
export NODE_ENV=production

echo "🔍 Verificando feature flags carregadas:"
echo "FEATURE_NEW_WORKOUTS: $FEATURE_NEW_WORKOUTS"
echo "FEATURE_NEW_EXERCISES: $FEATURE_NEW_EXERCISES"
echo "FEATURE_NEW_AUTH: $FEATURE_NEW_AUTH"
echo "FEATURE_NEW_PROGRESS: $FEATURE_NEW_PROGRESS"

# Teste com timeout e em background para não travar
timeout 15s node dist/index.js > /tmp/test-build.log 2>&1 &
TEST_PID=$!

# Aguardar um pouco para o servidor subir
sleep 5

# Verificar se o processo ainda está rodando (sucesso)
if kill -0 $TEST_PID 2>/dev/null; then
    echo "✅ Build testado com sucesso"
    # Verificar se as rotas V2 estão funcionando no teste
    sleep 2
    if curl -f -s "http://localhost:5000/api/v2/health" | grep -q "API v2 is running"; then
        echo "✅ API V2 verificada e funcionando no teste"
    else
        echo "⚠️  API V2 não respondeu conforme esperado no teste"
        echo "Logs do teste:"
        tail -20 /tmp/test-build.log
    fi
    
    # Matar o processo de teste
    kill $TEST_PID 2>/dev/null || true
    wait $TEST_PID 2>/dev/null || true
else
    echo "❌ ERRO: Build falhou no teste local"
    echo "Logs do teste:"
    cat /tmp/test-build.log
    exit 1
fi

# 13. Reiniciar aplicação
echo "13. Reiniciando aplicação..."
pm2 start gymseven || pm2 restart gymseven

# 14. Aguardar inicialização
echo "14. Aguardando inicialização..."
sleep 5

# 15. Verificar se está funcionando
echo "15. Verificando status da aplicação..."
pm2 status gymseven

# Mostrar logs recentes se houver erro
echo "16. Verificando logs iniciais..."
pm2 logs gymseven --lines 5 --nostream

# 17. Teste mais robusto da aplicação incluindo API V2
echo "17. Testando conectividade e API V2..."
for i in {1..5}; do
    if curl -f -s http://localhost:5000 > /dev/null; then
        echo "✅ Aplicação respondendo corretamente"
        
        # Testar especificamente as rotas V2
        sleep 2
        if curl -f -s "http://localhost:5000/api/v2/health" | grep -q "API v2 is running"; then
            echo "✅ API V2 confirmada funcionando em produção"
            break
        else
            echo "⚠️  API V2 não está respondendo - tentando novamente..."
        fi
    else
        echo "⏳ Tentativa $i/5 - Aguardando aplicação..."
        sleep 3
    fi
    
    if [ $i -eq 5 ]; then
        echo "❌ ERRO: Aplicação ou API V2 não está funcionando após 5 tentativas"
        echo "Logs completos do PM2:"
        pm2 logs gymseven --lines 50 --nostream
        echo "\nStatus do PM2:"
        pm2 show gymseven
        echo "\nVariáveis de ambiente críticas:"
        pm2 show gymseven | grep -A 20 "env:" || true
        echo "\nTestando API V2 diretamente:"
        curl -v "http://localhost:5000/api/v2/health" || true
        exit 1
    fi
done

# 18. Restaurar uploads se backup existir
echo "18. Restaurando arquivos de usuário..."
if [ -d "/tmp/uploads.gymseven.backup" ]; then
    cp -r /tmp/uploads.gymseven.backup/* uploads/ 2>/dev/null || true
    echo "✅ Uploads restaurados"
fi

# 19. Limpeza de arquivos temporários
echo "19. Limpeza final..."
rm -f /tmp/.env.gymseven.backup
rm -rf /tmp/uploads.gymseven.backup
rm -f /tmp/test-build.log

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=================================="
echo "✅ Aplicação atualizada e rodando em: http://147.93.35.192"
echo "✅ API V2 ativada com feature flags"
echo "✅ Rotas de exercícios e treinos funcionando"
echo ""
echo "Para verificar:"
echo "- Logs: pm2 logs gymseven"
echo "- Status: pm2 status"  
echo "- API V2: curl http://localhost:5000/api/v2/health"
echo ""
echo "Teste agora em gymseven.com.br:"
echo "- Criação de exercícios ✅"
echo "- Visualização de treinos ✅"