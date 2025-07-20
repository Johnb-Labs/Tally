# Tally by JBLabs - Project Overview

## What is Tally?

Tally is a full-stack contact management application built with modern web technologies. It's designed as a white-label solution for organizations that need to:

- Import contact data from Excel/CSV files
- Manage contacts across multiple divisions
- Provide role-based access control
- Generate reports and analytics
- Customize branding per organization/division

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** for styling with dark mode support
- **Radix UI** components for accessibility
- **Chart.js** for data visualization

### Backend
- **Node.js** with Express.js server
- **TypeScript** for type safety across the stack
- **PostgreSQL** database with Neon serverless driver
- **Drizzle ORM** for type-safe database operations
- **Zod** for runtime validation
- **Multer** for file upload handling

### Authentication
- Internal JWT-based authentication system
- **bcryptjs** for password hashing
- Session management with PostgreSQL storage
- Role-based permissions (Admin, Uploader, User)

## Key Features

### Multi-tenant Architecture
- **Divisions**: Organizations can be split into multiple divisions
- **Custom Branding**: Each division can have its own logo, colors, and theme
- **Data Isolation**: Users only see data from their assigned divisions

### File Import System
- Support for Excel (.xlsx, .xls) and CSV files
- Intelligent field mapping interface
- Progress tracking and error handling
- File size limits and validation

### User Management
- Three user roles with different permissions:
  - **Admin**: Full system access and management
  - **Uploader**: Can import data and manage contacts
  - **User**: Read-only access to contacts and reports

### Reporting & Analytics
- Contact growth charts and statistics
- Division-based reporting
- Export functionality (PDF, Excel, CSV)
- Real-time dashboard updates

## Project Structure

```
tally-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (routes)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── contexts/       # React context providers
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── auth.ts            # Authentication logic
│   ├── storage.ts         # Database operations
│   └── db.ts              # Database connection
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and types
├── uploads/               # Temporary file storage
└── dist/                  # Built application files
```

## Development Philosophy

### Type Safety First
- TypeScript everywhere (frontend, backend, shared)
- Zod schemas for runtime validation
- Drizzle ORM for type-safe database queries

### Component-Based Architecture
- Reusable UI components with Radix UI
- Custom hooks for business logic
- Context providers for global state

### API-First Design
- RESTful API endpoints
- Consistent error handling
- Request/response validation

### Security by Design
- Role-based access control
- Input validation and sanitization
- Secure file upload handling
- Environment-based configuration