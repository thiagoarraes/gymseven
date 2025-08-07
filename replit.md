# Overview

GymSeven is a mobile-first workout logging application built with modern web technologies. The app allows users to manage exercises, create workout templates, log workout sessions, and track their fitness progress. It features a clean, dark-themed interface optimized for mobile devices with a focus on simplicity and ease of use during workouts.

# User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)
- ✓ **MIGRATION COMPLETED: Successfully migrated from Replit Agent to Replit environment (August 2025)**
- ✓ **SUPABASE INTEGRATION PERMANENTLY CONFIGURED: Application ALWAYS uses Supabase as primary database**
- ✓ **CONFIGURED SUPABASE AS PERMANENT PRIMARY DATABASE: No fallback to other providers**
- ✓ **FIXED: Workout template deletion working perfectly with cascade dependency management**
- ✓ **FIXED: Exercise names now display correctly in workout template editor**
- ✓ Configured PostgreSQL database integration with automatic provider fallback
- ✓ Set up proper database schema migrations using Drizzle ORM
- ✓ Fixed environment compatibility issues for seamless Replit deployment
- ✓ Application successfully switched to Supabase database integration
- ✓ Application running successfully on port 5000 with Supabase PostgreSQL database
- ✅ **FIXED: Exercise addition to workout templates working perfectly with Supabase database**
- ✅ Implemented automatic conversion of rep ranges (e.g., "8-12" → 8) for database compatibility
- ✅ Resolved all table naming and field mapping issues between client and Supabase
- ✓ Successfully migrated from Replit Agent to Replit environment
- ✓ Configured PostgreSQL database with proper schema migrations
- ✓ Successfully switched from Neon to Supabase database, then back to Neon due to Supabase connection issues
- ✓ Implemented fallback system to auto-switch to working database provider
- ✓ Integrated with Supabase for production-ready database hosting
- ✓ Added SSL support and connection pooling for Supabase compatibility
- ✓ Created detailed setup guide for Supabase integration
- ✓ Built comprehensive test suite for Supabase verification
- ✓ Added automatic retry mechanisms and error handling
- ✓ Implemented provider-specific optimizations (Supabase, Neon, PostgreSQL)
- ✓ Redesigned exercises page with clean, modern interface (removed images and descriptions)
- ✓ Added exercise selection mode for adding exercises to workout templates
- ✓ Created workout template editor with exercise management functionality
- ✓ Enhanced mobile-first design with improved user experience
- ✓ Implemented direct editing of sets, reps, and weights in workout templates
- ✓ Added exercise removal functionality from workout templates
- ✓ Fixed exercise name and muscle group display in template editor
- ✓ Redesigned workout cards to show actual exercise count and list
- ✓ Made exercise areas clickable for adding exercises to templates
- ✓ Removed time estimation and creation date from workout cards for cleaner design
- ✓ Added customizable rest duration for each exercise in workout templates
- ✓ Integrated custom rest timers in workout session with per-exercise durations
- ✓ Improved card layout in template editor with better component distribution
- ✓ Redesigned exercise cards with modern UI/UX, color-coded parameters, and glassmorphism effects
- ✓ Added exercise name display in workout session header for better context
- ✓ Implemented automatic workout completion when finishing the last set of the last exercise
- ✓ Added celebratory completion screen with confetti animation and motivational message
- ✓ Modified celebration screen to wait for user action instead of auto-redirect
- ✓ Fixed critical issue: migrated from in-memory storage to PostgreSQL database
- ✓ Progress page now works with real persistent workout data
- ✓ Resolved Supabase connection issues by implementing database provider fallback system
- ✓ Application now automatically uses Neon database when Supabase is unavailable
- ✓ **COMPLETED: Full Supabase SDK integration using official @supabase/supabase-js**
- ✓ **Tables created manually in Supabase dashboard and verified working**
- ✓ **All CRUD operations tested and functioning with Supabase SDK**
- ✓ **Production-ready Supabase integration with proper environment variables**

# System Architecture

## Frontend Architecture

The client-side is built as a Single Page Application (SPA) using:
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management and caching
- **Vite** as the build tool and development server
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling with a dark theme and glassmorphism effects

The app follows a mobile-first design with:
- Fixed header and bottom navigation for easy mobile access
- Responsive layout that adapts to different screen sizes
- Touch-friendly interface elements
- PWA-ready structure for offline capabilities

## Backend Architecture

The server uses:
- **Express.js** with TypeScript for the REST API
- **ESM modules** throughout the codebase
- Middleware for request logging and error handling
- RESTful endpoints for exercises, workout templates, and workout logs

The API structure includes:
- `/api/exercises` - Exercise management (CRUD operations)
- `/api/workout-templates` - Workout template management
- `/api/workout-logs` - Workout session tracking
- Validation using Zod schemas shared between client and server

## Data Management

**Database Layer:**
- **Supabase** as the PERMANENT primary database (PostgreSQL-based)
- **@supabase/supabase-js** SDK for all database operations
- **Production-ready** hosting with real-time features and authentication
- **Always prioritized** - application configured to require Supabase
- Shared schema definitions between client and server in TypeScript

**Data Models:**
- Users for authentication
- Exercises with muscle group categorization
- Workout templates with associated exercises
- Workout logs for tracking actual sessions
- Set tracking for detailed exercise logging

**Client-side Storage:**
- LocalStorage for offline data persistence
- TanStack Query cache for optimized data fetching
- Offline-first approach with sync capabilities

## State Management

- **TanStack Query** handles all server state, caching, and background updates
- **React Hook Form** with Zod validation for form state management
- Local component state using React hooks
- Shared state through React Context where needed

## Development Workflow

The project uses:
- **TypeScript** throughout for type safety
- **Vite** for fast development and hot module replacement
- **ESBuild** for production builds
- **Path mapping** for clean imports (@/ for client, @shared for shared code)
- Development middleware integration for seamless full-stack development

# External Dependencies

## UI and Styling
- **@radix-ui/react-*** - Accessible UI primitives for complex components
- **tailwindcss** - Utility-first CSS framework with dark theme support
- **class-variance-authority** - For component variant management
- **lucide-react** - Icon library for consistent iconography

## Data and API
- **PostgreSQL** - Primary database (compatible with Supabase, Neon, or any PostgreSQL provider)
- **drizzle-orm** - Type-safe ORM for database operations
- **drizzle-zod** - Zod integration for schema validation
- **@tanstack/react-query** - Server state management and caching
- **pg** - PostgreSQL client with connection pooling

## Forms and Validation
- **react-hook-form** - Performant form library
- **@hookform/resolvers** - Form validation resolvers
- **zod** - Schema validation library

## Development Tools
- **@replit/vite-plugin-runtime-error-modal** - Development error handling
- **@replit/vite-plugin-cartographer** - Replit-specific development features
- **tsx** - TypeScript execution for development server

## Utilities
- **date-fns** - Date manipulation and formatting
- **clsx** and **tailwind-merge** - Conditional CSS class handling
- **wouter** - Lightweight routing solution
- **embla-carousel-react** - Carousel component for UI