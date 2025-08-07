# 🚀 GymSeven - Configuração Automática para Replit

## Para Novos Usuários (Fork/Clone)

### ✅ Execução Automática (Recomendado)
1. **Fork este projeto** no seu Replit
2. **Configure Supabase Secrets** (obrigatório):
   - Vá em **Secrets** (🔒) no painel lateral
   - Adicione: `SUPABASE_URL` (URL do projeto Supabase)
   - Adicione: `SUPABASE_SERVICE_ROLE_KEY` (Service Role Key)
3. **Clique em Run** - tudo será configurado automaticamente!

### 🔧 Se Aparecer Problemas de Instalação
Se você ver erros como "tsx not found" ou problemas de pacotes:

```bash
# Execute no terminal/shell:
./setup.sh
```

Ou se o setup.sh não funcionar:
```bash
chmod +x start.mjs
node start.mjs
```

### 📋 Soluções para Problemas Comuns

**1. "Cannot find module 'express'"**
```bash
npm install
npm run dev
```

**2. "tsx not found"**
```bash
./setup.sh
# ou
mkdir -p node_modules/.bin
echo '#!/bin/bash\nexec npx tsx "$@"' > node_modules/.bin/tsx
chmod +x node_modules/.bin/tsx
```

**3. Problemas de permissão**
```bash
chmod +x setup.sh start.mjs
```

**4. Banco de dados não conecta**
- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão nos Secrets
- Confirme se as credenciais estão corretas no painel do Supabase

## 🎯 Configurações Incluídas para Execução Limpa

### Arquivos criados para robustez:
- ✅ `.npmrc` - Configurações NPM otimizadas
- ✅ `setup.sh` - Script de configuração automática  
- ✅ `start.mjs` - Inicializador robusto com fallbacks
- ✅ `README.md` - Documentação completa
- ✅ Workflow atualizado para máxima compatibilidade

### Recursos de auto-recuperação:
- 🔄 Auto-instalação de dependências
- 🔄 Criação automática do wrapper tsx
- 🔄 Verificação automática de credenciais
- 🔄 Fallback para armazenamento temporário sem Supabase
- 🔄 Logs detalhados para debug

## 📱 Sobre o GymSeven

**GymSeven** é um aplicativo mobile-first para registro de treinos com:
- Interface otimizada para mobile
- Gerenciamento completo de exercícios
- Templates de treino personalizáveis  
- Acompanhamento de progresso
- Banco de dados Supabase permanente
- Design moderno com tema escuro

**Tecnologias:** React 18, TypeScript, Express, Supabase, TailwindCSS, shadcn/ui

---

🎉 **Pronto!** Seu GymSeven deve funcionar perfeitamente em qualquer conta Replit!