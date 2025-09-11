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

# Verificar se as variáveis críticas estão no .env
echo "4. Verificando variáveis de ambiente críticas..."
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

echo "✅ Variáveis críticas do Supabase encontradas no .env"

# 5. Instalar novas dependências (se houver)
echo "5. Verificando dependências..."
npm install --no-optional

# 6. Limpar builds anteriores
echo "6. Limpando builds anteriores..."
rm -rf dist/

# 7. Fazer novo build
echo "7. Compilando aplicação..."
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 8. Verificar se build foi bem-sucedido
echo "8. Verificando integridade do build..."
if [ ! -f "dist/public/index.html" ]; then
    echo "❌ ERRO: Build do frontend falhou - dist/public/index.html não encontrado"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ ERRO: Build do servidor falhou - dist/index.js não encontrado"
    exit 1
fi

echo "✅ Build verificado com sucesso"

# 9. Fazer backup dos uploads (se existirem)
echo "9. Fazendo backup de arquivos de usuário..."
if [ -d "uploads" ]; then
    cp -r uploads /tmp/uploads.gymseven.backup
    echo "✅ Backup de uploads realizado"
fi

# 10. Testar se build funciona localmente
echo "10. Testando build antes do restart..."
export NODE_ENV=production
if ! timeout 10s node dist/index.js > /tmp/test-build.log 2>&1; then
    echo "❌ ERRO: Build falhou no teste local"
    echo "Logs do teste:"
    cat /tmp/test-build.log
    exit 1
fi

echo "✅ Build testado com sucesso"

# 11. Reiniciar aplicação
echo "11. Reiniciando aplicação..."
pm2 restart gymseven

# 12. Aguardar inicialização
echo "12. Aguardando inicialização..."
sleep 5

# 13. Verificar se está funcionando
echo "13. Verificando status da aplicação..."
pm2 status gymseven

# Mostrar logs recentes se houver erro
echo "14. Verificando logs iniciais..."
pm2 logs gymseven --lines 5 --nostream

# Teste mais robusto da aplicação
echo "15. Testando conectividade..."
for i in {1..5}; do
    if curl -f -s http://localhost:5000 > /dev/null; then
        echo "✅ Aplicação respondendo corretamente"
        break
    else
        echo "⏳ Tentativa $i/5 - Aguardando aplicação..."
        sleep 2
    fi
    
    if [ $i -eq 5 ]; then
        echo "❌ ERRO: Aplicação não está respondendo após 5 tentativas"
        echo "Logs completos do PM2:"
        pm2 logs gymseven --lines 50 --nostream
        echo "\nStatus do PM2:"
        pm2 show gymseven
        echo "\nVariáveis de ambiente críticas:"
        pm2 show gymseven | grep -A 20 "env:"
        exit 1
    fi
done

# 16. Restaurar uploads se backup existir
echo "16. Restaurando arquivos de usuário..."
if [ -d "/tmp/uploads.gymseven.backup" ]; then
    cp -r /tmp/uploads.gymseven.backup/* uploads/ 2>/dev/null || true
    echo "✅ Uploads restaurados"
fi

# 17. Limpeza de arquivos temporários
echo "17. Limpeza final..."
rm -f /tmp/.env.gymseven.backup
rm -rf /tmp/uploads.gymseven.backup

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=================================="
echo "Aplicação atualizada e rodando em: http://147.93.35.192"
echo "Para verificar logs: pm2 logs gymseven"
echo "Para verificar status: pm2 status"