# Overview

GymSeven is a mobile-first workout logging application designed to manage exercises, create workout templates, log sessions, and track fitness progress. It features a clean, dark-themed interface optimized for mobile devices, focusing on simplicity and ease of use during workouts. The project's vision is to provide a seamless and intuitive fitness tracking experience, leveraging modern web technologies to deliver a high-performance and reliable application. Key capabilities include a gamified progression system with levels, achievements, and statistics based on real workout data, and secure user data isolation.

# User Preferences

Preferred communication style: Simple, everyday language.
Display preferences: Use username (nickname) instead of firstName for user greetings and display.

# System Architecture

## Frontend Architecture

The client-side is a Single Page Application (SPA) built with React 18 and TypeScript. It uses Wouter for routing, TanStack Query for server state management, and Vite as the build tool. UI components are built using shadcn/ui (on Radix UI primitives) and styled with Tailwind CSS, featuring dark/light theme support and glassmorphism effects. The application adheres to a mobile-first design philosophy, ensuring responsiveness, touch-friendly elements, and a PWA-ready structure. Key UI/UX decisions include a fixed header and bottom navigation for mobile accessibility, responsive layouts, intuitive interface elements, and features like image cropping for avatars and professional area charts for progress visualization.

## Backend Architecture

The server is built with Express.js and TypeScript, utilizing ESM modules. It provides RESTful APIs for exercise management, workout template management, workout log tracking, and achievement management. All API routes require authentication and enforce strict user data isolation via `user_id` filtering. Data validation is handled using Zod schemas, shared between the client and server.

## Data Management


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
- **react-image-crop**: Image cropping functionality.
- **recharts**: Charting library.

## Data and API
- **drizzle-orm**: Type-safe ORM.
- **drizzle-zod**: Zod integration for schema validation.
- **@tanstack/react-query**: Server state management and caching.
- **pg**: PostgreSQL client.

## Forms and Validation
- **react-hook-form**: Performant form library.
- **@hookform/resolvers**: Form validation resolvers.
- **zod**: Schema validation library.

## Utilities
- **date-fns**: Date manipulation and formatting.
- **clsx** and **tailwind-merge**: Conditional CSS class handling.
- **wouter**: Lightweight routing solution.
- **embla-carousel-react**: Carousel component.
- **bcrypt**: Password hashing.
- **jsonwebtoken**: For JWT-based authentication.