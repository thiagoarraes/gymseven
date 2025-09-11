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

# 3. Restaurar .env
echo "3. Restaurando configurações..."
cp /tmp/.env.gymseven.backup .env

# 4. Instalar novas dependências (se houver)
echo "4. Verificando dependências..."
npm install --no-optional

# 5. Limpar builds anteriores
echo "5. Limpando builds anteriores..."
rm -rf dist/

# 6. Fazer novo build
echo "6. Compilando aplicação..."
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 7. Verificar se build foi bem-sucedido
echo "7. Verificando integridade do build..."
if [ ! -f "dist/public/index.html" ]; then
    echo "❌ ERRO: Build do frontend falhou - dist/public/index.html não encontrado"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ ERRO: Build do servidor falhou - dist/index.js não encontrado"
    exit 1
fi

echo "✅ Build verificado com sucesso"

# 8. Fazer backup dos uploads (se existirem)
echo "8. Fazendo backup de arquivos de usuário..."
if [ -d "uploads" ]; then
    cp -r uploads /tmp/uploads.gymseven.backup
    echo "✅ Backup de uploads realizado"
fi

# 9. Reiniciar aplicação
echo "9. Reiniciando aplicação..."
pm2 restart gymseven

# 10. Aguardar inicialização
echo "10. Aguardando inicialização..."
sleep 5

# 11. Verificar se está funcionando
echo "11. Verificando status da aplicação..."
pm2 status gymseven

# Teste mais robusto da aplicação
echo "12. Testando conectividade..."
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
        pm2 logs gymseven --lines 20
        exit 1
    fi
done

# 13. Restaurar uploads se backup existir
echo "13. Restaurando arquivos de usuário..."
if [ -d "/tmp/uploads.gymseven.backup" ]; then
    cp -r /tmp/uploads.gymseven.backup/* uploads/ 2>/dev/null || true
    echo "✅ Uploads restaurados"
fi

# 14. Limpeza de arquivos temporários
echo "14. Limpeza final..."
rm -f /tmp/.env.gymseven.backup
rm -rf /tmp/uploads.gymseven.backup

echo ""
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=================================="
echo "Aplicação atualizada e rodando em: http://147.93.35.192"
echo "Para verificar logs: pm2 logs gymseven"
echo "Para verificar status: pm2 status"