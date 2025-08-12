# Overview

GymSeven is a mobile-first workout logging application designed to manage exercises, create workout templates, log sessions, and track fitness progress. It features a clean, dark-themed interface optimized for mobile devices, focusing on simplicity and ease of use during workouts. The project's vision is to provide a seamless and intuitive fitness tracking experience, leveraging modern web technologies to deliver a high-performance and reliable application.

## Recent Changes (August 12, 2025)

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