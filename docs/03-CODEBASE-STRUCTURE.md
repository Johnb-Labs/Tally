# Codebase Structure Guide

## Directory Overview

```
tally-app/
├── client/                 # Frontend React application
├── server/                 # Backend Express application  
├── shared/                 # Shared types and schemas
├── uploads/                # File upload storage
├── docs/                   # Documentation files
├── dist/                   # Built production files
└── configuration files     # Root config files
```

## Frontend Structure (`client/`)

### Main Directories

```
client/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── Sidebar.tsx    # Main navigation
│   │   ├── TopHeader.tsx  # Page headers
│   │   └── ThemeToggle.tsx # Dark mode toggle
│   ├── pages/             # Page components (routes)
│   │   ├── Landing.tsx    # Public landing page
│   │   ├── Login.tsx      # Login form
│   │   ├── Register.tsx   # Registration form
│   │   ├── Dashboard.tsx  # Main dashboard
│   │   ├── Upload.tsx     # File upload page
│   │   ├── Contacts.tsx   # Contact management
│   │   ├── Reports.tsx    # Analytics and reports
│   │   └── UserManagement.tsx # Admin user management
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts     # Authentication hook
│   │   ├── use-toast.ts   # Toast notifications
│   │   └── use-mobile.tsx # Mobile detection
│   ├── lib/               # Utility functions
│   │   ├── queryClient.ts # TanStack Query setup
│   │   ├── utils.ts       # General utilities
│   │   └── authUtils.ts   # Auth helper functions
│   ├── contexts/          # React context providers
│   │   └── BrandContext.tsx # Branding and theming
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
└── index.html            # HTML template
```

### Key Frontend Files

#### `App.tsx`
- Main application component
- Route definitions with Wouter
- Authentication-based routing
- Layout wrapper for authenticated pages

#### `components/Sidebar.tsx`
- Main navigation for authenticated users
- Role-based menu items
- User profile display
- Division selector integration

#### `components/TopHeader.tsx`
- Page headers with title and description
- Division selector dropdown
- Action buttons (export, etc.)
- Theme toggle integration

#### `hooks/useAuth.ts`
- Authentication state management
- User data fetching
- Login/logout status
- Role-based access helpers

#### `contexts/BrandContext.tsx`
- Branding and theming state
- Division-specific customization
- Logo, colors, and organization name
- CSS custom property management

## Backend Structure (`server/`)

```
server/
├── index.ts              # Server entry point
├── routes.ts             # API route definitions
├── auth.ts               # Authentication logic
├── storage.ts            # Database operations
├── db.ts                 # Database connection
└── vite.ts               # Vite integration
```

### Key Backend Files

#### `index.ts`
- Express server setup
- Middleware configuration
- Static file serving
- Port binding and startup

#### `routes.ts`
- All API endpoint definitions
- Authentication middleware integration
- Request validation
- Error handling

#### `auth.ts`
- JWT token management
- Password hashing with bcryptjs
- Session handling
- Authentication middleware

#### `storage.ts`
- Database abstraction layer
- CRUD operations for all entities
- Type-safe database queries
- Business logic implementation

#### `db.ts`
- PostgreSQL connection setup
- Drizzle ORM configuration
- Database pool management
- Connection error handling

## Shared Structure (`shared/`)

```
shared/
└── schema.ts             # Database schema and types
```

### `schema.ts`
- Drizzle ORM table definitions
- TypeScript type exports
- Zod validation schemas
- Relationship definitions

Key tables:
- `users` - User accounts and roles
- `divisions` - Organizational divisions
- `contacts` - Contact data
- `uploads` - File upload tracking
- `auditLogs` - Activity logging
- `sessions` - Session storage

## Configuration Files

### Root Level Files

#### `package.json`
- Dependencies and scripts
- Build configuration
- Development tools setup

#### `tsconfig.json`
- TypeScript configuration
- Path aliases (@/ for client/src/)
- Compilation options

#### `vite.config.ts`
- Vite build configuration
- Plugin setup
- Development server options
- Build optimizations

#### `tailwind.config.ts`
- Tailwind CSS configuration
- Custom theme colors
- Dark mode setup
- Component variants

#### `drizzle.config.ts`
- Database configuration
- Migration settings
- Schema file location

#### `components.json`
- shadcn/ui configuration
- Component installation settings
- Styling preferences

## File Naming Conventions

### Frontend Components
- **PascalCase** for component files: `UserManagement.tsx`
- **camelCase** for hooks: `useAuth.ts`
- **kebab-case** for utility files: `auth-utils.ts`

### Backend Files
- **camelCase** for all backend files: `storage.ts`
- **PascalCase** for class names: `DatabaseStorage`

### Pages
- **PascalCase** matching route names: `Dashboard.tsx` for `/`
- Descriptive names: `UserManagement.tsx` for `/users`

## Import/Export Patterns

### Frontend Imports
```typescript
// External libraries first
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal imports with @ alias
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

// Relative imports last
import './ComponentName.css';
```

### Backend Imports
```typescript
// Node.js modules first
import express from 'express';
import bcrypt from 'bcryptjs';

// Local imports
import { db } from './db';
import { users, type User } from '@shared/schema';
```

## Code Organization Principles

### Single Responsibility
- Each file has one primary purpose
- Components focus on UI rendering
- Hooks manage state and side effects
- Utils provide pure functions

### Colocation
- Related files are grouped together
- Page-specific components near their pages
- Shared components in common directory

### Type Safety
- All functions have explicit return types
- Props interfaces are well-defined
- Database operations are type-safe
- API responses are validated

### Consistent Patterns
- Same patterns for data fetching
- Consistent error handling
- Standardized component structure
- Uniform naming conventions