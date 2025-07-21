# Tally by JBLabs - Contact Management System

## Overview

This is a full-stack contact management application built with a modern tech stack. It's a white-label solution designed for organizations to manage contacts with role-based access control, division management, and customizable branding.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Latest Updates (January 21, 2025)
- ✓ Contact deletion functionality implemented with role-based permissions
  - Added individual delete buttons for each contact row (admin/uploader only)
  - Implemented bulk selection with master and individual checkboxes
  - Created "Select/Cancel" toggle for bulk operations mode
  - Built bulk delete operation with smart confirmation dialogs
  - Applied consistent badge styling with white text and margin classes
  - Changed "Category" column to "Division" throughout contact directory
- ✓ Enhanced field mapping with division selection and auto-mapping
  - Added division selection dropdown in field mapping process
  - Users must specify target division before processing uploads
  - Implemented intelligent auto-mapping based on header patterns
  - Added all address fields (address, city, province, postal code) to field selection
  - Created PATCH route for upload processing with division assignment
- ✓ Localized application for South Africa
  - Updated database schema: 'state' → 'province', 'zipCode' → 'postalCode'
  - Updated all CSV templates with South African contacts and locations
  - Changed phone number formats to South African standards (+27)
  - Updated CSV import guide with South African terminology
- ✓ Created comprehensive USER_GUIDE.md with step-by-step instructions
- ✓ Added role-specific guides for Admin, Uploader, and User accounts
- ✓ Included troubleshooting section and general features guide
- ✓ Created DEPLOYMENT_GUIDE.html for Linux server deployment
- ✓ Added complete server setup instructions with PostgreSQL, Nginx, SSL
- ✓ Created comprehensive developer documentation suite in docs/ directory
- ✓ Added 8 separate guide files covering all aspects of development
- ✓ Comprehensive dark mode functionality implemented across all pages
- ✓ Enhanced Landing page with video background and improved branding layout
- ✓ Fixed authentication API calls in Login/Register forms
- ✓ Added "exco" (executive) role with company-wide dashboard access
- ✓ Implemented dynamic field management for admin/uploader users
- ✓ Removed public registration - admin-only user creation system
- ✓ Added DivisionSelector component with company/division view toggle
- ✓ Created CompanyDashboard with comprehensive company-wide statistics
- ✓ Updated user management with division assignments and role-based permissions


## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for dynamic theming
- **Charts**: Chart.js with react-chartjs-2 for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with Zod validation schemas
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **File Handling**: Multer for file uploads (Excel/CSV processing)

### Database Design
- **Users**: Role-based system (admin, uploader, user) with profile information
- **Divisions**: Multi-tenant organization with custom branding per division
- **Contacts**: Main data entity with flexible field mapping
- **Uploads**: File upload tracking with processing status
- **Audit Logs**: Complete activity tracking for compliance
- **Sessions**: Secure session storage in PostgreSQL

## Key Components

### Authentication & Authorization
- Replit-based OAuth integration with role-based permissions
- Session management with PostgreSQL backing store
- Route protection based on user roles and division access

### File Upload & Processing
- Support for Excel (.xlsx, .xls) and CSV file formats
- Intelligent field mapping system for flexible data import
- Progress tracking and error handling for large uploads
- File validation and size limits (10MB default)

### Data Management
- Flexible contact schema with custom field mapping
- Division-based data isolation and permissions
- Audit logging for all data modifications
- Contact categorization and tagging system

### Branding & Theming
- White-label customization with logo, colors, and organization name
- Division-level branding overrides
- CSS custom properties for dynamic theme switching
- Dark/light mode support

### Reporting & Analytics
- Dashboard with contact growth charts and statistics
- Contact distribution by categories and divisions
- Export functionality for reports and data
- Visual analytics with Chart.js integration

## Data Flow

1. **Authentication Flow**: User authenticates via Replit OAuth → Session created in PostgreSQL → User permissions loaded
2. **File Upload Flow**: File uploaded → Stored temporarily → Headers parsed → Field mapping interface → Data processed → Contacts created → Audit logged
3. **Data Access Flow**: User requests → Permission check → Division filter applied → Data retrieved → Response sent
4. **Branding Flow**: Division selected → Branding settings loaded → CSS variables updated → UI re-rendered

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe database queries and migrations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework

### File Processing
- **multer**: File upload handling
- **connect-pg-simple**: PostgreSQL session store
- **memoizee**: Function memoization for performance

### Authentication
- **openid-client**: OpenID Connect client implementation
- **passport**: Authentication middleware framework

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Frontend build tool and dev server

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- tsx for running TypeScript server directly
- Database migrations via Drizzle Kit
- Environment variables for configuration

### Production
- Vite builds optimized frontend bundle to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Express serves both API routes and static frontend
- PostgreSQL database with connection pooling
- Environment-based configuration for database and auth

### Database Management
- Drizzle migrations in `migrations/` directory
- Schema definitions in `shared/schema.ts`
- Push-based development workflow with `db:push`
- PostgreSQL with proper indexing for performance

The application is designed to be deployed on Replit with automatic database provisioning, but can be adapted for other hosting platforms with PostgreSQL support.