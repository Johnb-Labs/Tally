# Tally by JBLabs - Developer Documentation

Welcome to the comprehensive developer documentation for Tally, a full-stack contact management application with white-label capabilities.

## Documentation Structure

This documentation is organized into separate sections for easy navigation and specific learning paths:

### 📋 [1. Project Overview](./01-PROJECT-OVERVIEW.md)
- Technology stack overview
- Key features and architecture
- Development philosophy
- Project structure introduction

### 🛠️ [2. Development Setup](./02-DEVELOPMENT-SETUP.md)
- Prerequisites and installation
- Local development environment
- Database setup
- Development tools and extensions

### 📁 [3. Codebase Structure](./03-CODEBASE-STRUCTURE.md)
- Directory organization
- File naming conventions
- Component architecture
- Import/export patterns

### 🗄️ [4. Database Schema](./04-DATABASE-SCHEMA.md)
- Table structure and relationships
- Drizzle ORM implementation
- Migration workflow
- Query examples

### ⚛️ [5. Frontend Development](./05-FRONTEND-DEVELOPMENT.md)
- React + TypeScript patterns
- State management with TanStack Query
- UI components and styling
- Authentication and routing

### 🔧 [6. Backend Development](./06-BACKEND-DEVELOPMENT.md)
- Express.js API structure
- Authentication system
- File upload handling
- Database operations

### 🔐 [7. Authentication System](./07-AUTHENTICATION-SYSTEM.md)
- JWT-based authentication
- Role-based access control
- Security best practices
- Frontend integration

### 🚀 [8. Deployment Guide](./08-DEPLOYMENT-GUIDE.md)
- Production server setup
- Nginx configuration
- SSL certificates
- Monitoring and maintenance

## Quick Start for Developers

If you're new to the project, follow this learning path:

1. **Start with [Project Overview](./01-PROJECT-OVERVIEW.md)** to understand the big picture
2. **Follow [Development Setup](./02-DEVELOPMENT-SETUP.md)** to get your environment running
3. **Study [Codebase Structure](./03-CODEBASE-STRUCTURE.md)** to navigate the code effectively
4. **Review [Database Schema](./04-DATABASE-SCHEMA.md)** to understand data relationships

Then dive into either:
- **[Frontend Development](./05-FRONTEND-DEVELOPMENT.md)** for UI/UX work
- **[Backend Development](./06-BACKEND-DEVELOPMENT.md)** for API development

## Key Technologies

- **Frontend**: React 18, TypeScript, TailwindCSS, TanStack Query
- **Backend**: Node.js, Express.js, PostgreSQL, Drizzle ORM
- **Authentication**: Internal JWT system with role-based access
- **Deployment**: Linux servers with Nginx, PM2, SSL

## Development Principles

### Type Safety First
- TypeScript throughout the entire stack
- Zod schemas for runtime validation
- Type-safe database queries with Drizzle

### Modern React Patterns
- Functional components with hooks
- Server state management with TanStack Query
- Component composition over inheritance

### API-First Design
- RESTful endpoints with consistent patterns
- Request/response validation
- Comprehensive error handling

### Security by Design
- Role-based access control
- Input validation and sanitization
- Secure authentication flow

## Getting Help

### Common Developer Tasks

- **Adding a new page**: See [Frontend Development - Routing](./05-FRONTEND-DEVELOPMENT.md#routing-with-wouter)
- **Creating API endpoints**: See [Backend Development - API Routes](./06-BACKEND-DEVELOPMENT.md#api-routes-serverroutests)
- **Database changes**: See [Database Schema - Migrations](./04-DATABASE-SCHEMA.md#migrations)
- **User permissions**: See [Authentication System - Roles](./07-AUTHENTICATION-SYSTEM.md#user-roles)

### File Structure Quick Reference

```
tally-app/
├── client/src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and API client
├── server/
│   ├── routes.ts       # API endpoints
│   ├── auth.ts         # Authentication logic
│   └── storage.ts      # Database operations
├── shared/
│   └── schema.ts       # Database schema and types
└── docs/               # This documentation
```

### Development Commands

```bash
# Start development server
npm run dev

# Database operations
npm run db:push          # Apply schema changes
npm run db:generate      # Generate migrations
npm run db:studio        # Open database GUI

# Build and test
npm run build           # Production build
npm run type-check      # TypeScript validation
npm test               # Run tests
```

## Contributing Guidelines

1. **Follow the existing code patterns** shown in the documentation
2. **Update types in `shared/schema.ts`** before implementing features
3. **Add proper error handling** for all user-facing operations
4. **Include JSDoc comments** for complex functions
5. **Test authentication flows** with different user roles

## Additional Resources

- **User Guides**: See `USER_GUIDE.md` in the root directory
- **Deployment**: See `DEPLOYMENT_GUIDE.html` for server setup
- **API Reference**: Available endpoints documented in each backend guide section

---

*This documentation is maintained alongside the codebase. When making significant changes, please update the relevant documentation sections.*