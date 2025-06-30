# Replit.md

## Overview

This is a full-stack web application called "Technician Task Manager" for managing a Telegram bot system that handles technician task assignments, invoicing, and client management. The application provides a comprehensive dashboard for administrators to manage technicians, create and assign tasks, generate invoices, and monitor bot activities. It's built as a modern web application with a React frontend and Express.js backend, using PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **API Style**: RESTful API design
- **Session Management**: Simple bearer token authentication (development setup)
- **Error Handling**: Centralized error handling middleware
- **Development**: tsx for TypeScript execution in development

### Data Storage Solutions
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless driver for PostgreSQL connectivity

## Key Components

### Database Schema
The application uses five main entities:
- **Users**: System administrators with username/password authentication
- **Technicians**: Telegram bot users who receive and complete tasks
- **Tasks**: Work assignments with client information, scheduling, and status tracking
- **Invoices**: Payment tracking linked to completed tasks and technicians
- **Bot Settings**: Configuration for Telegram bot behavior and notifications
- **Notifications**: System alerts and activity logging

### Authentication System
- Simple bearer token system for demo purposes
- Session-based authentication middleware
- Role-based access control (admin role)
- Local storage for client-side token persistence

### UI/UX Features
- **Multi-language Support**: English and Arabic with RTL layout support
- **Dark/Light Theme**: CSS variable-based theming system
- **Audio Notifications**: Web Audio API integration for real-time alerts
- **Responsive Design**: Mobile-first approach with responsive components
- **Accessibility**: ARIA labels and keyboard navigation support

## Data Flow

### Task Management Flow
1. Admin creates task with client details and scheduling information
2. Task is assigned to available technician via Telegram bot
3. Technician accepts/rejects task through bot interface
4. Status updates flow from bot to database to admin dashboard
5. Upon completion, invoice generation is triggered

### Real-time Updates
- Server-side events trigger database updates
- React Query automatically refetches data based on query invalidation
- Audio notifications alert users to important status changes
- Toast notifications provide immediate user feedback

### API Communication
- RESTful endpoints for CRUD operations
- JSON request/response format
- Error responses include status codes and descriptive messages
- Request logging middleware for debugging and monitoring

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Neon serverless driver
- **UI Components**: Extensive Radix UI primitive collection
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns for date manipulation
- **Validation**: Zod for runtime type checking and validation

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code formatting and linting (implied)
- **Vite Plugins**: Runtime error overlay and development enhancements

### Telegram Integration
- Bot framework integration (implementation pending)
- Webhook handling for real-time updates
- Message templating and localization support

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Frontend served on port 5000, backend API on same port
- **Hot Reload**: Vite development server with HMR
- **Development Command**: `npm run dev` runs both frontend and backend

### Production Build
- **Build Process**: Vite builds frontend assets, ESBuild bundles backend
- **Asset Optimization**: Automatic code splitting and minification
- **Static Serving**: Express serves built frontend assets
- **Environment Variables**: DATABASE_URL required for database connection

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Deployment Target**: Autoscale deployment
- **Port Mapping**: Internal port 5000 mapped to external port 80
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

## Changelog

```
Changelog:
- June 18, 2025. Initial setup
- June 18, 2025. Fixed responsive sidebar navigation for all screen sizes
- June 18, 2025. Resolved authentication issues preventing data loading
- June 18, 2025. Added missing secondary pages: Language Settings, Activity History, Backup & Restore
- June 18, 2025. Implemented mobile-friendly overlay system for sidebar
- June 23, 2025. Resolved bot settings conflict by removing duplicate pages
- June 23, 2025. Enhanced bot status display with improved visual indicators
- June 23, 2025. Implemented comprehensive bot message translation system
- June 23, 2025. Added dynamic language detection for bot messages (Arabic/German/English)
- June 23, 2025. Improved bot status card design with compact layout
- June 23, 2025. Fixed bot username display to show actual username instead of "Loading..."
- June 23, 2025. Redesigned bot toggle button to match notification toggle style for consistent UI
- June 23, 2025. Cleaned up project by removing Laravel experiment files and unused dependencies
- June 23, 2025. Removed laravel-app directory and related files (composer.phar, database files, deployment scripts)
- June 24, 2025. Enhanced reports functionality with comprehensive export capabilities (PDF/Excel/CSV)
- June 24, 2025. Added filtering and data visualization for tasks, technicians, and invoices reports
- June 24, 2025. Implemented PDF generation and Telegram integration for individual invoices
- June 24, 2025. Added export utilities with German language support for all report types
- June 24, 2025. Fixed PDF text encoding issues with comprehensive sanitization for international characters
- June 24, 2025. Updated application name to be language-specific: "Technician Task Manager" (EN), "Techniker Task Manager" (DE), "مدير مهام الفنيين" (AR)
- June 24, 2025. Implemented fully functional backup and restore system with real API endpoints for data export/import
- June 24, 2025. Merged Database Management page with Backup & Restore page for unified data management
- June 24, 2025. Enhanced German translations for backup functionality with accurate technical terminology
- June 25, 2025. Fixed critical PDF export functionality for invoices with proper jsPDF integration
- June 25, 2025. Completely removed Telegram invoice sending buttons as requested by user
- June 25, 2025. Restructured invoice table by removing Task Reference column for cleaner layout
- June 25, 2025. Fixed invoice table headers to display in German (Rechnungsnummer, Techniker, Betrag, etc.)
- June 25, 2025. Added fallback PDF generation system to ensure reliable invoice downloads
- June 26, 2025. Patched critical security vulnerability CVE-2025-30208 by upgrading Vite from 5.4.14 to 5.4.15
- June 26, 2025. Created complete Next.js Static Export version for shared hosting deployment
- June 26, 2025. Developed comprehensive PHP backend API with MySQL/MariaDB support
- June 26, 2025. Implemented full feature parity between Express.js and static export versions
- June 26, 2025. Added automated build and deployment scripts for shared hosting providers
- June 26, 2025. Created comprehensive deployment documentation and database schema
- June 26, 2025. Established complete project infrastructure for production deployment on Hostinger/cPanel hosting
- June 26, 2025. Fixed critical Telegram bot language synchronization issue where bot messages weren't matching system interface language
- June 26, 2025. Enhanced bot language detection to automatically reload system language settings before each message transmission
- June 26, 2025. Created complete professional German marketing landing page with pricing system, customer portal, and Telegram Bot purchase integration
- June 26, 2025. Developed comprehensive Arabic RTL landing page with detailed technical specifications, dynamic screenshot gallery, and complete system workflow documentation based on codebase analysis
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```