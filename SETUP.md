# 🚀 Setup Rápido - GymSeven

## ⚡ Para Importar do GitHub

Quando você importar este projeto do GitHub para o Replit:

### 1. 📋 Configure as Credenciais (2 minutos)

1. **Abrir painel de Secrets:**
   - Clique em `Tools` > `Secrets` no painel lateral

2. **Adicionar 3 credenciais obrigatórias:**
   ```
   SUPABASE_SERVICE_ROLE_KEY    = eyJhbGci...sua-chave-service  
   SUPABASE_ANON_KEY           = eyJhbGci...sua-chave-publica
   ```

3. **Como encontrar suas credenciais:**
   - Vá no seu projeto → `Settings` → `API`
   - Copie: `Project URL` e as duas chaves

### 2. 🔧 Verificar Setup

Execute no terminal:
```bash
node scripts/setup.js
```

Se algo estiver faltando, o script mostrará exatamente o que configurar.

### 3. 🎯 Iniciar App

```bash
npm run dev
```

Ou use o script seguro:
```bash
node scripts/dev-with-check.js
```

---

## 📋 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `node scripts/setup.js` | Verificar se está tudo configurado |
| `node scripts/check-secrets.js` | Apenas verificar credenciais |
| `node scripts/dev-with-check.js` | Iniciar app com verificação |
| `npm run dev` | Iniciar app normal |

---

## ⚠️ Troubleshooting

**Erro de credenciais?**
- Chaves devem começar com `eyJ`

**App não inicia?**
- Execute `node scripts/check-secrets.js` primeiro
- Verifique se está no diretório correto do projeto

**Não consegue encontrar as credenciais?**
- Consulte o arquivo `.env.example`
- Todas as instruções estão lá

---

## ✅ Checklist de Setup

- [ ] Projeto importado do GitHub
- [ ] Credenciais configuradas no Replit Secrets  
- [ ] Script de verificação passou (`node scripts/setup.js`)
- [ ] App iniciado com sucesso (`npm run dev`)

## 🎉 Pronto!

Seu GymSeven está configurado e funcionando!