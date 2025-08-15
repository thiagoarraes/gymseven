# Overview

GymSeven is a mobile-first workout logging application designed to manage exercises, create workout templates, log sessions, and track fitness progress. It features a clean, dark-themed interface optimized for mobile devices, focusing on simplicity and ease of use during workouts. The project's vision is to provide a seamless and intuitive fitness tracking experience, leveraging modern web technologies to deliver a high-performance and reliable application.

## Recent Changes (August 15, 2025)

**✅ Sistema de Nível Estilo Video Game e Estatísticas de Treino Aprimorados:**
- Sistema completo de níveis com barra de progresso estilo RPG
- Badge circular de nível com gradiente azul-roxo e tag "LVL" 
- Títulos progressivos: Novato → Iniciante → Atleta → Veterano → Expert → Mestre → Lenda → Imortal
- Sistema de XP baseado em pontos de conquistas com crescimento exponencial
- Username com @ estilo gamer tag e percentual de progresso visual
- Cards de estatísticas substituídos por métricas reais de treino:
  - **Treinos Completados:** Total de workouts realizados
  - **Sequência:** Dias consecutivos de treino calculados automaticamente
  - **Este Mês:** Treinos do mês atual com nome do mês em português
  - **Duração:** Tempo médio dos treinos em minutos
- Integração com dados reais dos workout logs para estatísticas precisas
- **Experiência gamificada completa com progressão matemática balanceada**

**✅ Página de Progresso Transformada em Sistema de Conquistas:**
- Transformação completa da página /progresso em sistema de conquistas moderno
- Interface UX/UI otimizada com cards de conquistas desbloqueadas/bloqueadas
- Sistema de progresso visual com barras de progresso e indicadores percentuais
- Categorização por tipos: treinos, força, consistência, marcos e especiais
- Sistema de níveis: bronze, silver, gold e platinum com cores distintivas
- Filtros e busca funcional para encontrar conquistas específicas
- Visão geral com estatísticas de pontos e conquistas por nível
- Design responsivo e mobile-first com hover effects e transições suaves
- Tabs organizadas separando conquistas desbloqueadas das bloqueadas
- Seção de dicas com orientações para desbloquear conquistas
- Integração preparada para dados reais de treinos (workoutLogs API)
- **Experiência gamificada completa para motivar usuários no fitness**

**✅ Página de Progresso Transformada em Sistema de Conquistas:**
- Transformação completa da página /progresso em sistema de conquistas moderno
- Interface UX/UI otimizada com cards de conquistas desbloqueadas/bloqueadas
- Sistema de progresso visual com barras de progresso e indicadores percentuais
- Categorização por tipos: treinos, força, consistência, marcos e especiais
- Sistema de níveis: bronze, silver, gold e platinum com cores distintivas
- Filtros e busca funcional para encontrar conquistas específicas
- Visão geral com estatísticas de pontos e conquistas por nível
- Design responsivo e mobile-first com hover effects e transições suaves
- Tabs organizadas separando conquistas desbloqueadas das bloqueadas
- Seção de dicas com orientações para desbloquear conquistas
- Integração preparada para dados reais de treinos (workoutLogs API)
- **Experiência gamificada completa para motivar usuários no fitness**

## Previous Changes (August 15, 2025)

**✅ Area Chart de Progresso Implementado na Sessão de Treino:**
- Area chart profissional implementado no accordion de progresso da sessão
- Pontos clicáveis com tooltip customizado e glassmorphism avançado
- Hover com efeitos de sombra e animações suaves nos pontos
- Tooltip mostra peso máximo, data e nome do treino com design elegante
- Gradiente azul/roxo consistente com o design da aplicação
- Integração perfeita com dados reais dos treinos concluídos
- Interface otimizada para mobile com toque responsivo nos pontos
- **UX/UI melhorada aplicada também no dashboard principal com tooltips glassmorphism**

## Recent Changes (August 13, 2025)

**✅ Sistema Completo de Tema Claro/Escuro Implementado:**
- Sistema de tema instantâneo com mudança imediata no dropdown de configurações
- Variáveis CSS responsivas em `index.css` para light/dark mode
- `ThemeContext` e `ThemeProvider` implementados com sincronização automática
- Classes CSS atualizadas em todas as páginas para usar variáveis de tema
- Header, bottom navigation, login, profile e outras páginas convertidas
- Glassmorphism adaptado para ambos os temas com transparências corretas
- Troca de tema sem necessidade de salvar - mudança instantânea ao selecionar
- Sistema de persistência do tema selecionado no localStorage
- Interface totalmente responsiva aos dois modos de visualização

**✅ Funcionalidade de Crop de Imagem para Avatar Implementada:**
- Sistema completo de crop de imagem para upload de avatar
- Componente `ImageCropModal` criado com `react-image-crop`
- Modal responsivo com controles de aspecto (quadrado/livre)
- Botões de confirmação e cancelamento claramente visíveis
- Integração completa com sistema de upload existente
- Validação mantida (JPEG, PNG, WebP, max 5MB)
- Processamento otimizado da imagem recortada antes do upload
- Interface melhorada para evitar distorção de imagens

**✅ Migração Completa e Funcionalidade de Avatar Implementada:**
- Migração do Replit Agent para Replit concluída com sucesso
- Supabase SDK configurado e conectado corretamente
- Funcionalidade completa de upload de avatar implementada
- Endpoint `/api/auth/upload-avatar` criado com validação de tipos e tamanho
- Interface de usuário com botão de câmera funcional
- Validação de arquivos (JPEG, PNG, WebP, max 5MB)
- Sistema de arquivos estáticos configurado com cache otimizado
- **Ação manual necessária:** Adicionar coluna `profile_image_url TEXT` na tabela `users` no Supabase
- **SQL para executar:** `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;`

## Previous Changes (August 12, 2025)

**✅ Migration to Replit Completed with Sample Data:**
- Successfully migrated project from Replit Agent to standard Replit environment
- Fixed all LSP diagnostics and database schema compatibility issues
- Created comprehensive sample data: 25 exercises across all muscle groups
- Added 7 realistic workout templates (Push/Pull/Legs/Full Body splits)
- Generated workout logs for testing with multiple dates (Aug 5-16, 2025)
- User authentication and API endpoints fully functional
- **Supabase integration fully operational and confirmed working**
- **Template exercises properly linked and workout logs contain realistic data**
- Application ready for development and testing with realistic data

**✅ User Data Isolation and Database Cleanup Completed:**
- Successfully implemented user data isolation with userId foreign key constraints
- Added user_id columns to exercises, workoutTemplates, and workoutLogs tables
- Updated all storage methods and API routes to filter data by authenticated user
- Fixed timezone bugs in date handling and dashboard greeting using username
- All data properly isolated - each user only sees their own exercises, templates, and logs
- Complete database cleanup performed - all user data (exercises, workouts, progress) cleared
- Security verification shows perfect data isolation with UUID constraints
- System ready for fresh user data with proper isolation mechanisms

**✅ Project Migration and Integration Completed:**
- Successfully migrated project from Replit Agent to standard Replit environment
- Supabase integration fully configured and operational with vlqzjrwxqeyroqsglqwr.supabase.co
- Environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) properly configured in Replit Secrets
- Database connection verified and sample data loaded successfully
- All packages installed and workflow running smoothly on port 5000
- Client/server separation maintained with robust security practices
- Profile update system fully functional with all user data columns
- Database schema updated with user profile fields (date_of_birth, height, weight, activity_level)
- Project ready for development and deployment on Replit platform

**Previous Migration Steps:**
- Removed all unnecessary deployment files (Netlify, Vercel configurations)
- Cleaned up project structure by removing debug scripts and test files
- Fixed all security vulnerabilities with JWT token generation
- Implemented robust client/server authentication separation 
- Added enhanced CORS configuration for Replit compatibility
- All LSP diagnostics resolved - clean, production-ready codebase

**Previous Netlify Integration:**
- Configured Netlify deployment with serverless functions
- Backend converted to serverless functions for Netlify compatibility
- Added production CORS configuration
- Created deployment guides and configuration files

**Previous Changes (August 11, 2025):**
- Full JWT-based authentication with bcrypt password hashing
- User registration and login with robust validation
- Protected routes and authentication context
- User profile management with avatar and dropdown menu
- Test user created: teste@gymseven.com / 123456

# User Preferences

Preferred communication style: Simple, everyday language.
Display preferences: Use username (nickname) instead of firstName for user greetings and display.
Database priority: Supabase is mandatory as the primary database.

# System Architecture

## Frontend Architecture

The client-side is a Single Page Application (SPA) built with React 18 and TypeScript. It uses Wouter for routing, TanStack Query for server state management, and Vite as the build tool. UI components are built using shadcn/ui (on Radix UI primitives) and styled with Tailwind CSS, featuring a dark theme and glassmorphism effects. The application adheres to a mobile-first design philosophy, ensuring responsiveness, touch-friendly elements, and a PWA-ready structure. Key UI/UX decisions include a fixed header and bottom navigation for mobile accessibility, responsive layouts, and intuitive interface elements.

## Backend Architecture

The server is built with Express.js and TypeScript, utilizing ESM modules. It provides RESTful APIs for exercise management, workout template management, and workout log tracking. API endpoints include `/api/exercises`, `/api/workout-templates`, and `/api/workout-logs`. Data validation is handled using Zod schemas, which are shared between the client and server.

## Data Management

The **MANDATORY database** is **Supabase** (PostgreSQL-based). Supabase is the ONLY supported database for this project, with all operations handled via the `@supabase/supabase-js` SDK. The application requires Supabase configuration:

1. **Supabase SDK** (REQUIRED) - Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
2. **PostgreSQL Direct** (Limited fallback) - Uses DATABASE_URL for basic functionality
3. **Memory Storage** (Emergency only) - Temporary storage when no database is configured

The SupabaseStorage class implements all CRUD operations using the Supabase SDK, providing real-time capabilities, automatic backups, and cloud persistence. Supabase credentials are securely stored in Replit Secrets. The application can extract Supabase configuration from DATABASE_URL when SDK-specific environment variables are not available. Shared schema definitions are maintained in TypeScript. Data models include users, exercises, workout templates, workout logs, and detailed set tracking. Client-side storage uses LocalStorage for offline data persistence and TanStack Query for optimized data fetching, supporting an offline-first approach with sync capabilities.

## State Management

TanStack Query manages all server state, caching, and background updates. React Hook Form with Zod validation handles form state. Local component state is managed with React hooks, and shared state is managed using React Context where necessary.

## Development Workflow

The project uses TypeScript for type safety, Vite for fast development with hot module replacement, and ESBuild for production builds. Path mapping (`@/` for client, `@shared` for shared code) ensures clean imports.

# External Dependencies

## UI and Styling
- **@radix-ui/react-***: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **class-variance-authority**: Component variant management.
- **lucide-react**: Icon library.

## Data and API
- **PostgreSQL**: Primary database (Supabase implementation).
- **drizzle-orm**: Type-safe ORM.
- **drizzle-zod**: Zod integration for schema validation.
- **@tanstack/react-query**: Server state management and caching.
- **pg**: PostgreSQL client.
- **@supabase/supabase-js**: Primary Supabase SDK for all database operations with real-time features.

## Forms and Validation
- **react-hook-form**: Performant form library.
- **@hookform/resolvers**: Form validation resolvers.
- **zod**: Schema validation library.

## Utilities
- **date-fns**: Date manipulation and formatting.
- **clsx** and **tailwind-merge**: Conditional CSS class handling.
- **wouter**: Lightweight routing solution.
- **embla-carousel-react**: Carousel component.