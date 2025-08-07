# GymSeven - Configuração do Ambiente

## Configuração das Variáveis de Ambiente

As credenciais do Supabase agora são armazenadas no arquivo `.env` para evitar ter que inserí-las a cada inicialização da aplicação.

### Arquivo `.env` (já configurado)

O arquivo `.env` na raiz do projeto contém:

```
# Environment Variables - GymSeven App
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
PORT=5000
NODE_ENV=development
```

### Como Funciona

1. **Carregamento Automático**: O servidor agora carrega automaticamente as variáveis do arquivo `.env` na inicialização
2. **Prioridade**: As variáveis de ambiente do Replit (Secrets) têm prioridade sobre o arquivo `.env`
3. **Segurança**: O arquivo `.env` está no `.gitignore` para não ser enviado para o controle de versão

### Arquivo de Exemplo

O arquivo `.env.example` contém um modelo para configuração:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Para Usar em Outro Ambiente

1. Copie o arquivo `.env.example` para `.env`
2. Substitua os valores pelos seus dados reais do Supabase
3. Execute `npm run dev`

### Localização das Credenciais no Supabase

1. Acesse o painel do seu projeto Supabase
2. Vá em "Settings" → "API"
3. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

Agora a aplicação iniciará automaticamente sem solicitar as credenciais a cada execução!