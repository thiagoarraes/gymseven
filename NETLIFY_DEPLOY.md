# Deploy GymSeven no Netlify

## Configuração Concluída

Sua aplicação GymSeven está agora configurada para deploy no Netlify com:

✅ Backend convertido para funções serverless
✅ Frontend React otimizado
✅ Configuração automática de rotas
✅ Suporte a Supabase
✅ CORS configurado para produção

## Arquivos Criados

- `netlify.toml` - Configuração principal do Netlify
- `netlify/functions/api.js` - Backend como função serverless
- `_redirects` - Redirecionamentos de API e SPA
- Este arquivo de instruções

## Como Fazer o Deploy

### Método 1: GitHub Integration (Recomendado)

1. **Conecte ao GitHub:**
   - Faça push do código para um repositório GitHub
   - Vá para [netlify.com](https://netlify.com)
   - Clique em "Add new site" > "Import an existing project"
   - Conecte sua conta GitHub
   - Selecione o repositório do GymSeven

2. **Configurações de Build:**
   - Build command: `npm run build:netlify`
   - Publish directory: `dist/public`
   - Functions directory: `netlify/functions`

3. **Variáveis de Ambiente:**
   No painel do Netlify, vá em Site Settings > Environment Variables e adicione:
   ```
   SUPABASE_URL=sua_url_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_supabase
   DATABASE_URL=sua_connection_string
   NODE_ENV=production
   ```

### Método 2: Netlify CLI

1. **Instale o CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login e Deploy:**
   ```bash
   netlify login
   netlify init
   netlify deploy --prod
   ```

### Método 3: Deploy Manual

1. **Build Local:**
   ```bash
   npm run build:netlify
   ```

2. **Deploy:**
   - Acesse [netlify.com](https://netlify.com)
   - Arraste a pasta `dist/public` para o painel

## Configurações do Frontend

O frontend React está configurado para:
- Fazer chamadas para `/api/*` (redirecionadas para funções serverless)
- Funcionar como SPA com React Router
- Suporte a PWA (se configurado)

## Configurações do Backend

O backend Express foi convertido para função serverless que:
- Mantém todas as rotas originais sob `/api/*`
- Conecta com Supabase automaticamente
- Gerencia CORS para produção
- Funciona com autenticação JWT

## Domínio Personalizado (Opcional)

1. No painel Netlify: Site Settings > Domain management
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções
4. SSL é configurado automaticamente

## Monitoramento

- **Logs:** Netlify Functions > View function logs
- **Analytics:** Site Overview no painel
- **Performance:** Core Web Vitals automático

## Troubleshooting

### Problema: Função não encontrada
- Verifique se `netlify/functions/api.js` existe
- Confirme o build command no `netlify.toml`

### Problema: CORS Error
- Adicione seu domínio Netlify nas configurações de CORS
- Verifique se as variáveis de ambiente estão corretas

### Problema: Database não conecta
- Confirme SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
- Teste a conexão localmente primeiro

## Desenvolvimento Local com Netlify

Para testar localmente com funções serverless:

```bash
# Instale Netlify CLI se não tiver
npm install -g netlify-cli

# Inicie o ambiente de desenvolvimento
netlify dev
```

Isso iniciará:
- Frontend: http://localhost:8888
- Funções: http://localhost:8888/.netlify/functions/api

## URLs de Produção

Após o deploy, sua aplicação estará disponível em:
- Site principal: `https://[nome-do-site].netlify.app`
- API: `https://[nome-do-site].netlify.app/api/*`

## Performance Tips

- Use `NODE_ENV=production` nas variáveis de ambiente
- Configure cache headers no `netlify.toml` se necessário
- Monitore usage das funções serverless
- Use Supabase para melhor performance do banco

Sua aplicação GymSeven está pronta para ser deployada no Netlify! 🚀