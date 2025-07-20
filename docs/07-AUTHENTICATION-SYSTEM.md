# Authentication System Guide

## Overview

Tally uses an internal JWT-based authentication system with role-based access control. Users can register, login, and access resources based on their assigned roles and division memberships.

## Authentication Flow

### 1. User Registration
```typescript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}

// Response
{
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "jwt-token-here"
}
```

### 2. User Login
```typescript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}

// Response
{
  "user": { /* user object */ },
  "token": "jwt-token-here"
}
```

### 3. Token Verification
```typescript
// Headers for protected requests
{
  "Authorization": "Bearer jwt-token-here"
}
```

## User Roles

### Admin Role
- **Full system access**
- Can manage users, divisions, and system settings
- Access to user management interface
- Can view audit logs
- Can manage branding and division settings

**Permissions**:
- Create/edit/delete users
- Create/edit/delete divisions
- Access all divisions
- View system-wide analytics
- Manage file uploads and imports
- Access audit logs

### Uploader Role
- **Data management access**
- Can upload and import files
- Can manage contacts within assigned divisions
- Limited administrative capabilities

**Permissions**:
- Upload Excel/CSV files
- Map fields and import data
- Create/edit/delete contacts
- View division analytics
- Access assigned divisions only

### User Role
- **Read-only access**
- Can view contacts and reports
- Cannot modify data
- Limited to assigned divisions

**Permissions**:
- View contacts (read-only)
- View reports and analytics
- Export data
- Access assigned divisions only

## Backend Authentication Implementation

### Password Hashing
```typescript
import bcrypt from 'bcryptjs';

export class AuthService {
  // Hash password for storage
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password during login
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
```

### JWT Token Management
```typescript
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  role: string;
  divisionIds: number[];
  iat: number;
  exp: number;
}

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET!;

  generateToken(user: User, divisionIds: number[]): string {
    const payload = {
      userId: user.id,
      role: user.role,
      divisionIds,
    };
    
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '7d',
      issuer: 'tally-app',
      audience: 'tally-users'
    });
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'tally-app',
        audience: 'tally-users'
      }) as TokenPayload;
      
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return null;
    }
  }

  refreshToken(token: string): string | null {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    // Generate new token with fresh expiration
    return jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        divisionIds: payload.divisionIds,
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }
}
```

## Middleware Implementation

### Authentication Middleware
```typescript
import type { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    divisionIds: number[];
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header required' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const authService = new AuthService();
  const payload = authService.verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = {
    userId: payload.userId,
    role: payload.role,
    divisionIds: payload.divisionIds,
  };

  next();
}
```

### Role-Based Authorization
```typescript
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

// Usage examples
router.get('/admin/users', requireAuth, requireRole(['admin']), getUsersHandler);
router.post('/uploads', requireAuth, requireRole(['admin', 'uploader']), uploadHandler);
router.get('/contacts', requireAuth, requireRole(['admin', 'uploader', 'user']), getContactsHandler);
```

### Division Access Control
```typescript
export function requireDivisionAccess() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const divisionId = parseInt(req.params.divisionId || req.body.divisionId || req.query.divisionId);
    
    if (!divisionId) {
      return res.status(400).json({ message: 'Division ID required' });
    }

    // Admins have access to all divisions
    if (req.user?.role === 'admin') {
      return next();
    }

    // Check if user has access to this division
    if (!req.user?.divisionIds.includes(divisionId)) {
      return res.status(403).json({ 
        message: 'Access denied to division',
        divisionId,
        userDivisions: req.user?.divisionIds
      });
    }

    next();
  };
}
```

## Frontend Authentication

### Auth Hook Implementation
```typescript
// hooks/useAuth.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => apiRequest('GET', '/api/auth/user'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });

      // Store token in localStorage
      localStorage.setItem('auth_token', response.token);
      
      // Update query cache
      queryClient.setQueryData(['/api/auth/user'], response.user);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      
      localStorage.setItem('auth_token', response.token);
      queryClient.setQueryData(['/api/auth/user'], response.user);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    queryClient.clear();
    window.location.href = '/login';
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    login,
    register,
    logout,
  };
}
```

### API Client with Authentication
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

const API_BASE = '';

export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<any> {
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (data && method !== 'GET') {
    if (data instanceof FormData) {
      // Don't set Content-Type for FormData, let browser set it
      delete config.headers!['Content-Type'];
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('401: Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`${response.status}: ${errorData.message || 'Request failed'}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
}

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey }) => {
        if (typeof queryKey[0] === 'string') {
          return apiRequest('GET', queryKey[0]);
        }
        throw new Error('Invalid query key');
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error.message.includes('401') || error.message.includes('403')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
```

## Route Protection

### Protected Route Component
```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [],
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation(redirectTo);
      return;
    }

    if (user && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      setLocation('/unauthorized');
      return;
    }
  }, [user, isLoading, isAuthenticated, requiredRoles, redirectTo, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
```

### Usage in App.tsx
```typescript
// App.tsx
import { Switch, Route } from 'wouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/users">
        <ProtectedRoute requiredRoles={['admin']}>
          <UserManagement />
        </ProtectedRoute>
      </Route>
      
      <Route path="/upload">
        <ProtectedRoute requiredRoles={['admin', 'uploader']}>
          <Upload />
        </ProtectedRoute>
      </Route>
      
      <Route path="/contacts">
        <ProtectedRoute requiredRoles={['admin', 'uploader', 'user']}>
          <Contacts />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
```

## Session Management

### Session Storage in Database
```sql
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);
```

### Session Configuration
```typescript
import session from 'express-session';
import connectPg from 'connect-pg-simple';

const pgStore = connectPg(session);

app.use(session({
  store: new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    tableName: 'sessions',
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
}));
```

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- Must contain at least one letter and one number
- Stored as bcrypt hash with salt rounds = 12

### Token Security
- JWT tokens expire after 7 days
- Tokens include issuer and audience claims
- Refresh tokens available for seamless renewal

### Environment Variables
```bash
# Required environment variables
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-key-here
DATABASE_URL=postgresql://...
```

### Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```