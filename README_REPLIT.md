# GymSeven - Configuração para Replit

Este é um guia para executar o GymSeven em qualquer conta do Replit sem erros.

## 🚀 Configuração Automática (Recomendada)

### Opção 1: Configuração Completa
```bash
node setup-replit.mjs
```

### Opção 2: Apenas Iniciar (se já configurado)
```bash
npm run dev
```

### Opção 3: Modo Robusto (se houver problemas)
```bash
node start-robust.mjs
```

## 🔧 Configuração Manual (se necessário)

### 1. Instalar Dependências
```bash
# Limpar cache
rm -rf node_modules package-lock.json

# Instalar pacotes
node install-packages.mjs
```

### 2. Corrigir Dependência Rollup
```bash
node fix-rollup.mjs
```

### 3. Configurar Credenciais Supabase
No painel do Replit, vá em "Secrets" e adicione:
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase

Para obter essas credenciais:
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Vá em Settings > API
5. Copie a URL e a service_role key

## 🛠️ Scripts Disponíveis

- `npm run setup` - Configuração completa automática
- `npm run dev` - Iniciar em modo desenvolvimento
- `npm run dev-robust` - Iniciar com método robusto
- `npm run build` - Construir para produção
- `npm run start` - Iniciar em modo produção

## 🔍 Solução de Problemas

### Erro: "tsx: not found"
```bash
node setup-replit.mjs
```

### Erro: "Cannot find module @rollup/rollup-linux-x64-gnu"
```bash
node fix-rollup.mjs
```

### Erro: "Supabase credentials not found"
Configure as credenciais nos Replit Secrets (veja seção 3 acima)

### Erro: "Port 5000 already in use"
```bash
pkill -f "tsx"
npm run dev
```

### Problemas de Instalação de Pacotes
```bash
rm -rf node_modules package-lock.json
node install-packages.mjs
```

## 📱 Sobre o GymSeven

GymSeven é um aplicativo de registro de treinos mobile-first com:
- Interface otimizada para celular
- Banco de dados Supabase integrado
- Templates de treino personalizáveis
- Histórico completo de exercícios
- Design moderno com tema escuro

## 🌟 Características Técnicas

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Banco de Dados**: Supabase (PostgreSQL)
- **UI**: shadcn/ui + Tailwind CSS
- **Roteamento**: Wouter
- **Estado**: TanStack Query

## 📞 Suporte

Se você ainda tiver problemas:
1. Execute `node setup-replit.mjs` novamente
2. Verifique se todas as credenciais estão configuradas
3. Tente o modo robusto: `node start-robust.mjs`