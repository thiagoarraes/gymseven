# 🚀 Deploy GymSeven no Netlify - Passo a Passo

## ✅ Pré-requisitos (Já Concluídos)
- [x] Aplicação configurada para Supabase
- [x] Credenciais Supabase configuradas
- [x] Backend convertido para funções serverless
- [x] Arquivos de configuração criados

## 📋 Passos para Deploy

### Passo 1: Criar conta no Netlify
1. Vá para [netlify.com](https://netlify.com)
2. Clique em "Sign up" se não tiver conta
3. Faça login com GitHub (recomendado)

### Passo 2: Preparar código no GitHub
1. Crie um repositório novo no GitHub
2. Faça commit de todo o código atual
3. Push para o repositório GitHub

### Passo 3: Conectar ao Netlify
1. No painel Netlify, clique "Add new site"
2. Escolha "Import an existing project"
3. Conecte com GitHub
4. Selecione seu repositório GymSeven

### Passo 4: Configurar Build Settings
**Configurações automáticas (já em netlify.toml):**
- Build command: `npm run build:netlify`
- Publish directory: `dist/public`
- Functions directory: `netlify/functions`

### Passo 5: Adicionar Variáveis de Ambiente
No painel Netlify:
1. Vá em Site settings → Environment variables
2. Adicione as seguintes variáveis:

```
SUPABASE_URL = sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY = sua_chave_supabase
NODE_ENV = production
```

### Passo 6: Deploy!
1. Clique "Deploy site"
2. Aguarde o build (2-5 minutos)
3. Sua aplicação estará em: `https://[nome-site].netlify.app`

## 🔧 Scripts Criados
- `build-netlify.js` - Script de build personalizado
- Configuração automática em `netlify.toml`

## ⚡ URLs após Deploy
- Site: `https://[seu-site].netlify.app`
- API: `https://[seu-site].netlify.app/api/*`

## 🛠️ Testar Localmente (Opcional)
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Testar localmente
netlify dev
```

## 🆘 Problemas Comuns
- **Build falha**: Verifique se todas as variáveis estão configuradas
- **API não funciona**: Confirme se as credenciais Supabase estão corretas
- **CORS errors**: As configurações já estão prontas para produção

Sua aplicação está pronta para deploy! 🎯