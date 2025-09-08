# GymSeven - Mobile Gym Workout Logger

GymSeven é um aplicativo mobile-first moderno para registro de treinos, construído com tecnologias web modernas. O aplicativo permite gerenciar exercícios, criar templates de treino, registrar sessões de treino e acompanhar o progresso fitness.

## 🚀 Execução Rápida no Replit

### Passo 1: Fork/Clone o projeto
1. Fork este projeto ou importe para sua conta do Replit
2. O Replit instalará automaticamente todas as dependências


1. Vá para **Secrets** (🔒) no painel lateral
2. Adicione estas duas chaves:

**Como obter as credenciais:**
2. Crie um novo projeto (se não tiver)
3. Vá em Settings > API
4. Copie a "URL" e "service_role secret"

### Passo 3: Executar
Clique em **Run** - o aplicativo iniciará automaticamente na porta 5000!

## 📱 Características

- **Mobile-First**: Interface otimizada para dispositivos móveis
- **Dark Theme**: Design moderno com tema escuro e efeitos glassmorfismo
- **Gerenciamento de Exercícios**: CRUD completo para exercícios
- **Templates de Treino**: Crie templates personalizados com exercícios
- **Registro de Treinos**: Log detalhado de sessões de treino
- **Acompanhamento de Progresso**: Visualize sua evolução

## 🛠 Tecnologias

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (gerenciamento de estado servidor)
- shadcn/ui + Radix UI
- Tailwind CSS
- Wouter (roteamento)

### Backend
- Express.js + TypeScript
- Drizzle ORM
- Zod (validação)

## 🔧 Solução de Problemas

### "tsx not found"
Se você ver esse erro, execute:
```bash
./setup.sh
```

### Problemas de conexão com banco
1. Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão nos Secrets
3. Reinicie o aplicativo

### Dependências não instaladas
O Replit deve instalar automaticamente. Se não funcionar:
1. Abra o Shell
2. Execute: `npm install`
3. Reinicie o projeto

## 📝 Estrutura do Projeto

```
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes UI
│   │   ├── pages/       # Páginas da aplicação
│   │   └── lib/         # Utilitários
├── server/          # Backend Express
│   ├── routes.ts    # Rotas da API
│   ├── storage.ts   # Camada de dados
│   └── index.ts     # Servidor principal
├── shared/          # Código compartilhado
│   └── schema.ts    # Schemas de dados
└── scripts/         # Scripts de utilitários
```

## 🌐 Deploy

Para fazer deploy no Replit:
2. Clique em **Deploy**
3. Escolha "Autoscale Deployment"
4. Seu app estará disponível em uma URL `.replit.app`

## 📄 Licença

MIT License - veja LICENSE para detalhes.