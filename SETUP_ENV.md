# Configuração das Variáveis de Ambiente

## Como configurar o .env

1. **Copie o arquivo exemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Obtenha suas credenciais do Supabase:**
   - Acesse https://app.supabase.com
   - Selecione seu projeto
   - Vá em Settings → API
   - Copie a **URL** e a **Service Role Key**

3. **Edite o arquivo .env:**
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
   ```

4. **Reinicie a aplicação:**
   - O servidor detectará automaticamente as novas credenciais
   - Você verá uma mensagem de "✅ Supabase configurado" no console

## Importante
- O arquivo `.env` já está no `.gitignore` por segurança
- Nunca compartilhe suas credenciais do Supabase
- Use sempre o arquivo `.env.example` como modelo