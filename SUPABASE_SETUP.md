# Integração com Supabase

## Como configurar o Supabase para sua aplicação GymSeven

### Passo 1: Criar projeto no Supabase
1. Acesse o [dashboard do Supabase](https://supabase.com/dashboard/projects)
2. Clique em "New Project"
3. Escolha sua organização
4. Preencha os detalhes do projeto:
   - Nome: GymSeven (ou o nome que preferir)
   - Senha do banco: Crie uma senha segura (anote esta senha!)
   - Região: Escolha a mais próxima do Brasil

### Passo 2: Obter a string de conexão
1. Após criar o projeto, vá para a página principal do projeto
2. Clique no botão "Connect" na barra superior
3. Na seção "Connection string", selecione "Transaction pooler"
4. Copie a URI completa
5. Substitua `[YOUR-PASSWORD]` pela senha que você criou no Passo 1

A string de conexão será algo como:
```
postgresql://postgres.[SEU-PROJETO]:[SUA-SENHA]@aws-0-[REGIÃO].pooler.supabase.com:6543/postgres
```

### Passo 3: Configurar no Replit
1. No seu projeto Replit, acesse a aba "Secrets" (ícone de chave no painel esquerdo)
2. Crie uma nova secret chamada `DATABASE_URL`
3. Cole a string de conexão do Supabase como valor

### Passo 4: Aplicar as migrations
Após configurar a DATABASE_URL, execute:
```bash
npm run db:push
```

### Passo 5: Reiniciar a aplicação
A aplicação será reiniciada automaticamente e conectará ao Supabase!

## Vantagens do Supabase
- ✅ Banco PostgreSQL totalmente gerenciado
- ✅ Backups automáticos
- ✅ Interface web para gerenciar dados
- ✅ Funcionalidades em tempo real (se precisar no futuro)
- ✅ Autenticação integrada (se precisar no futuro)
- ✅ APIs REST automáticas
- ✅ Escalabilidade automática

## Compatibilidade
Sua aplicação já está 100% compatível com Supabase pois:
- Usa PostgreSQL (mesmo banco que o Supabase)
- Usa Drizzle ORM (funciona perfeitamente com Supabase)
- Todas as queries e schemas já estão prontos

Precisa apenas da string de conexão para funcionar!