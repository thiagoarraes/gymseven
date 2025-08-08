# Overview

GymSeven is a mobile-first workout logging application designed to manage exercises, create workout templates, log sessions, and track fitness progress. It features a clean, dark-themed interface optimized for mobile devices, focusing on simplicity and ease of use during workouts. The project's vision is to provide a seamless and intuitive fitness tracking experience, leveraging modern web technologies to deliver a high-performance and reliable application.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is a Single Page Application (SPA) built with React 18 and TypeScript. It uses Wouter for routing, TanStack Query for server state management, and Vite as the build tool. UI components are built using shadcn/ui (on Radix UI primitives) and styled with Tailwind CSS, featuring a dark theme and glassmorphism effects. The application adheres to a mobile-first design philosophy, ensuring responsiveness, touch-friendly elements, and a PWA-ready structure. Key UI/UX decisions include a fixed header and bottom navigation for mobile accessibility, responsive layouts, and intuitive interface elements.

## Backend Architecture

The server is built with Express.js and TypeScript, utilizing ESM modules. It provides RESTful APIs for exercise management, workout template management, and workout log tracking. API endpoints include `/api/exercises`, `/api/workout-templates`, and `/api/workout-logs`. Data validation is handled using Zod schemas, which are shared between the client and server.

## Data Management

The **PERMANENT primary database** is **Supabase** (PostgreSQL-based), with all operations handled via the `@supabase/supabase-js` SDK. The application is configured to always prioritize and require Supabase for data persistence. Shared schema definitions are maintained in TypeScript. Data models include users, exercises, workout templates, workout logs, and detailed set tracking. Client-side storage uses LocalStorage for offline data persistence and TanStack Query for optimized data fetching, supporting an offline-first approach with sync capabilities.

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
- **@supabase/supabase-js**: Supabase SDK for database operations.

## Forms and Validation
- **react-hook-form**: Performant form library.
- **@hookform/resolvers**: Form validation resolvers.
- **zod**: Schema validation library.

## Utilities
- **date-fns**: Date manipulation and formatting.
- **clsx** and **tailwind-merge**: Conditional CSS class handling.
- **wouter**: Lightweight routing solution.
- **embla-carousel-react**: Carousel component.