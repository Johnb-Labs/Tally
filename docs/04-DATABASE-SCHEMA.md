# Database Schema Guide

## Overview

Tally uses PostgreSQL with Drizzle ORM for type-safe database operations. All schema definitions are in `shared/schema.ts` to ensure consistency between frontend and backend.

## Core Tables

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'user',
    profile_image_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Store user accounts and authentication data

**Key Fields**:
- `id`: UUID primary key
- `email`: Unique identifier for login
- `password_hash`: bcrypt hashed password
- `role`: 'admin', 'uploader', or 'user'

### Divisions Table
```sql
CREATE TABLE divisions (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    logo_url VARCHAR,
    primary_color VARCHAR DEFAULT '#1976D2',
    secondary_color VARCHAR DEFAULT '#424242',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Multi-tenant organization structure

**Key Fields**:
- `name`: Division display name
- `logo_url`: Custom branding logo
- `primary_color`, `secondary_color`: Theme colors

### User Divisions (Junction Table)
```sql
CREATE TABLE user_divisions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    division_id INTEGER REFERENCES divisions(id),
    can_manage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Many-to-many relationship between users and divisions

**Key Fields**:
- `can_manage`: Whether user can manage division settings

### Contacts Table
```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    division_id INTEGER REFERENCES divisions(id),
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    company VARCHAR,
    position VARCHAR,
    category_id INTEGER REFERENCES contact_categories(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Store contact information

**Key Fields**:
- `division_id`: Links contact to specific division
- Contact fields: `first_name`, `last_name`, `email`, `phone`, etc.
- `category_id`: Optional categorization

### Contact Categories Table
```sql
CREATE TABLE contact_categories (
    id SERIAL PRIMARY KEY,
    division_id INTEGER REFERENCES divisions(id),
    name VARCHAR NOT NULL,
    color VARCHAR DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Categorize contacts within divisions

### Uploads Table
```sql
CREATE TABLE uploads (
    id SERIAL PRIMARY KEY,
    division_id INTEGER REFERENCES divisions(id),
    user_id VARCHAR REFERENCES users(id),
    filename VARCHAR NOT NULL,
    original_name VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'pending',
    field_mapping JSONB,
    processed_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    errors JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Track file uploads and processing

**Key Fields**:
- `status`: 'pending', 'processing', 'completed', 'failed'
- `field_mapping`: JSON mapping of CSV columns to database fields
- `processed_count`, `error_count`: Processing statistics

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    division_id INTEGER REFERENCES divisions(id),
    action VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    entity_id VARCHAR,
    details JSONB,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Track all system activities for compliance

**Key Fields**:
- `action`: 'create', 'update', 'delete', 'login', etc.
- `entity_type`: 'user', 'contact', 'division', etc.
- `details`: JSON with change details

### Sessions Table
```sql
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);
```

**Purpose**: Store user sessions

## Drizzle Schema Definition

The schema is defined in TypeScript using Drizzle ORM:

```typescript
// shared/schema.ts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("user"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const divisions = pgTable("divisions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  primaryColor: varchar("primary_color").default("#1976D2"),
  secondaryColor: varchar("secondary_color").default("#424242"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Additional tables...
```

## Relationships

### User Relationships
```typescript
export const usersRelations = relations(users, ({ many }) => ({
  divisions: many(userDivisions),
  uploads: many(uploads),
  auditLogs: many(auditLogs),
}));
```

### Division Relationships
```typescript
export const divisionsRelations = relations(divisions, ({ many }) => ({
  users: many(userDivisions),
  contacts: many(contacts),
  categories: many(contactCategories),
  uploads: many(uploads),
}));
```

## Type Generation

Drizzle automatically generates TypeScript types:

```typescript
// Inferred types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Division = typeof divisions.$inferSelect;
export type Contact = typeof contacts.$inferSelect;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertContactSchema = createInsertSchema(contacts);
```

## Database Operations

### Common Queries

#### User Operations
```typescript
// Get user by ID
const user = await db.select().from(users).where(eq(users.id, userId));

// Get user with divisions
const userWithDivisions = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    divisions: {
      with: {
        division: true
      }
    }
  }
});
```

#### Contact Operations
```typescript
// Get contacts for division
const contacts = await db.select().from(contacts)
  .where(eq(contacts.divisionId, divisionId))
  .orderBy(contacts.lastName, contacts.firstName);

// Search contacts
const searchResults = await db.select().from(contacts)
  .where(and(
    eq(contacts.divisionId, divisionId),
    or(
      ilike(contacts.firstName, `%${query}%`),
      ilike(contacts.lastName, `%${query}%`),
      ilike(contacts.email, `%${query}%`)
    )
  ));
```

#### Division Operations
```typescript
// Get division with stats
const divisionStats = await db
  .select({
    division: divisions,
    contactCount: count(contacts.id)
  })
  .from(divisions)
  .leftJoin(contacts, eq(divisions.id, contacts.divisionId))
  .where(eq(divisions.id, divisionId))
  .groupBy(divisions.id);
```

## Migrations

### Using Drizzle Kit

```bash
# Generate migration files
npm run db:generate

# Push schema changes (development)
npm run db:push

# Apply migrations (production)
npm run db:migrate
```

### Migration Files
Generated in `migrations/` directory:
```
migrations/
├── 0000_initial_schema.sql
├── 0001_add_audit_logs.sql
└── meta/
    ├── _journal.json
    └── 0000_snapshot.json
```

## Database Indexes

Key indexes for performance:

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);

-- Contact searches
CREATE INDEX idx_contacts_division ON contacts(division_id);
CREATE INDEX idx_contacts_name ON contacts(last_name, first_name);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Audit log queries
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Session cleanup
CREATE INDEX idx_sessions_expire ON sessions(expire);
```

## Data Validation

### Zod Schemas
```typescript
// User validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Contact validation
export const contactSchema = createInsertSchema(contacts, {
  email: z.string().email().optional(),
  phone: z.string().optional()
});
```

### Database Constraints
- Email uniqueness for users
- Foreign key relationships enforced
- Not null constraints on required fields
- Default values for optional fields

## Backup Strategy

### Development
```bash
# Backup database
pg_dump -h localhost -U tally_dev tally_dev > backup.sql

# Restore database
psql -h localhost -U tally_dev -d tally_dev < backup.sql
```

### Production
- Automated daily backups
- Point-in-time recovery
- Cross-region replication
- Regular backup testing