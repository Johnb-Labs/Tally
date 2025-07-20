# Backend Development Guide

## Express.js + TypeScript Architecture

The backend is built with Express.js and TypeScript, providing a RESTful API with authentication, file upload handling, and database operations.

## Server Structure

### Main Server Setup (`server/index.ts`)
```typescript
import express from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { registerRoutes } from './routes';
import { setupVite } from './vite';

const app = express();
const port = parseInt(process.env.PORT || "5000");

// Session configuration
const pgStore = connectPg(session);
app.use(session({
  store: new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup routes and Vite
await registerRoutes(app);
setupVite(app);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
```

## Authentication System

### JWT-Based Authentication (`server/auth.ts`)
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from '@shared/schema';

interface TokenPayload {
  userId: string;
  role: string;
  divisionIds: number[];
}

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET!;

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generateToken(user: User, divisionIds: number[]): string {
    const payload: TokenPayload = {
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
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }
}

// Authentication middleware
export function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const authService = new AuthService();
  const payload = authService.verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.user = payload;
  next();
}

// Role-based authorization
export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}
```

## API Routes (`server/routes.ts`)

### Route Structure
```typescript
import express from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from './auth';
import { storage } from './storage';
import { z } from 'zod';
import { contactSchema, userSchema } from '@shared/schema';

export function registerRoutes(app: express.Express) {
  const router = express.Router();

  // Authentication routes
  router.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || !await authService.verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const divisionIds = await storage.getUserDivisions(user.id);
      const token = authService.generateToken(user, divisionIds);
      
      res.json({ user, token });
    } catch (error) {
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Protected routes
  router.get('/auth/user', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Contact management
  router.get('/contacts', requireAuth, async (req: any, res) => {
    try {
      const { divisionId, search, page = 1, limit = 50 } = req.query;
      
      // Validate division access
      if (divisionId && !req.user.divisionIds.includes(parseInt(divisionId))) {
        return res.status(403).json({ message: 'Access denied to division' });
      }

      const contacts = await storage.getContacts({
        divisionId: divisionId ? parseInt(divisionId) : undefined,
        search: search?.toString(),
        page: parseInt(page),
        limit: parseInt(limit),
        userDivisionIds: req.user.divisionIds,
      });

      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  router.post('/contacts', requireAuth, requireRole(['admin', 'uploader']), async (req: any, res) => {
    try {
      const validation = contactSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: validation.error.errors 
        });
      }

      const contact = await storage.createContact(validation.data);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user.userId,
        action: 'create',
        entityType: 'contact',
        entityId: contact.id.toString(),
        details: { contact: validation.data },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create contact' });
    }
  });

  app.use('/api', router);
}
```

## File Upload Handling

### Multer Configuration
```typescript
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});

// File upload route
router.post('/uploads', requireAuth, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadRecord = await storage.createUpload({
      divisionId: parseInt(req.body.divisionId),
      userId: req.user.userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      status: 'pending',
    });

    // Process file asynchronously
    processFileAsync(uploadRecord.id, req.file.path);

    res.status(201).json(uploadRecord);
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});
```

### File Processing
```typescript
import xlsx from 'xlsx';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

async function processFileAsync(uploadId: number, filePath: string) {
  try {
    await storage.updateUpload(uploadId, { status: 'processing' });

    const upload = await storage.getUpload(uploadId);
    if (!upload) return;

    let data: any[] = [];

    if (upload.fileType.includes('sheet')) {
      // Process Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(worksheet);
    } else if (upload.fileType === 'text/csv') {
      // Process CSV file
      data = await new Promise((resolve, reject) => {
        const results: any[] = [];
        createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject);
      });
    }

    // Store headers for field mapping
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    await storage.updateUpload(uploadId, {
      status: 'ready_for_mapping',
      fieldMapping: { headers },
    });

  } catch (error) {
    await storage.updateUpload(uploadId, {
      status: 'failed',
      errors: { processing: error.message },
    });
  }
}

// Field mapping and import
router.post('/uploads/:id/import', requireAuth, async (req: any, res) => {
  try {
    const uploadId = parseInt(req.params.id);
    const { fieldMapping } = req.body;

    const upload = await storage.getUpload(uploadId);
    if (!upload || upload.status !== 'ready_for_mapping') {
      return res.status(400).json({ message: 'Upload not ready for import' });
    }

    await storage.updateUpload(uploadId, { 
      status: 'importing',
      fieldMapping 
    });

    // Import contacts based on field mapping
    const results = await importContactsFromFile(upload, fieldMapping);

    await storage.updateUpload(uploadId, {
      status: results.errors.length > 0 ? 'completed_with_errors' : 'completed',
      processedCount: results.processed,
      errorCount: results.errors.length,
      errors: { import: results.errors },
    });

    res.json({ 
      processed: results.processed,
      errors: results.errors 
    });

  } catch (error) {
    res.status(500).json({ message: 'Import failed' });
  }
});
```

## Database Layer (`server/storage.ts`)

### Storage Interface
```typescript
import { db } from './db';
import { users, contacts, divisions, uploads, auditLogs } from '@shared/schema';
import { eq, and, ilike, desc, count } from 'drizzle-orm';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Contact operations
  getContacts(params: GetContactsParams): Promise<Contact[]>;
  createContact(contactData: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<Contact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;

  // Division operations
  getDivisions(userId?: string): Promise<Division[]>;
  createDivision(divisionData: InsertDivision): Promise<Division>;
  
  // Upload operations
  createUpload(uploadData: InsertUpload): Promise<Upload>;
  getUpload(id: number): Promise<Upload | undefined>;
  updateUpload(id: number, updates: Partial<Upload>): Promise<Upload>;

  // Audit operations
  createAuditLog(logData: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(params: GetAuditLogsParams): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getContacts(params: GetContactsParams): Promise<Contact[]> {
    let query = db.select().from(contacts);

    const conditions = [];
    
    if (params.divisionId) {
      conditions.push(eq(contacts.divisionId, params.divisionId));
    } else if (params.userDivisionIds?.length) {
      conditions.push(inArray(contacts.divisionId, params.userDivisionIds));
    }

    if (params.search) {
      conditions.push(
        or(
          ilike(contacts.firstName, `%${params.search}%`),
          ilike(contacts.lastName, `%${params.search}%`),
          ilike(contacts.email, `%${params.search}%`),
          ilike(contacts.company, `%${params.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(contacts.lastName, contacts.firstName)
      .limit(params.limit || 50)
      .offset(((params.page || 1) - 1) * (params.limit || 50));
  }

  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();
```

## Error Handling

### Global Error Handler
```typescript
// Error handling middleware
app.use((error: Error, req: any, res: any, next: any) => {
  console.error('Server error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.message
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Unauthorized'
    });
  }

  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});
```

### Custom Error Classes
```typescript
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}
```

## API Documentation

### Response Formats
```typescript
// Success response
{
  data: T,
  message?: string
}

// Error response
{
  message: string,
  errors?: ValidationError[],
  code?: string
}

// Paginated response
{
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

### Standard HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (business logic errors)
- `500` - Internal Server Error

## Performance Optimization

### Database Indexing
```sql
-- Common query indexes
CREATE INDEX idx_contacts_division_id ON contacts(division_id);
CREATE INDEX idx_contacts_name ON contacts(last_name, first_name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Caching Strategy
```typescript
import memoize from 'memoizee';

// Cache division data (rarely changes)
const getCachedDivision = memoize(
  async (id: number) => await storage.getDivision(id),
  { maxAge: 5 * 60 * 1000 } // 5 minutes
);

// Cache user permissions
const getCachedUserPermissions = memoize(
  async (userId: string) => await storage.getUserDivisions(userId),
  { maxAge: 10 * 60 * 1000 } // 10 minutes
);
```

### Request Validation
```typescript
import { z } from 'zod';

const queryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  divisionId: z.coerce.number().optional(),
});

// Validation middleware
export function validateQuery(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: result.error.errors
      });
    }
    req.query = result.data;
    next();
  };
}
```