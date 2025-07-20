# Development Environment Setup

## Prerequisites

Before you can edit and run Tally locally, you need:

- **Node.js 18+** (LTS recommended)
- **PostgreSQL 12+** 
- **Git** for version control
- **Code Editor** (VS Code recommended)

## Local Development Setup

### 1. Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/yourusername/tally-app.git
cd tally-app

# If using SSH
git clone git@github.com:yourusername/tally-app.git
cd tally-app
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# This installs both frontend and backend dependencies
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql

# Create database and user
sudo -i -u postgres
psql
CREATE DATABASE tally_dev;
CREATE USER tally_dev WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE tally_dev TO tally_dev;
\q
exit
```

#### Option B: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name tally-postgres \
  -e POSTGRES_DB=tally_dev \
  -e POSTGRES_USER=tally_dev \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Development Environment
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://tally_dev:dev_password@localhost:5432/tally_dev
PGHOST=localhost
PGPORT=5432
PGDATABASE=tally_dev
PGUSER=tally_dev
PGPASSWORD=dev_password

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-development-key-here

# Application Configuration
REPL_ID=tally-development
REPLIT_DOMAINS=localhost:5000
```

### 5. Initialize Database

```bash
# Push database schema
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

### 6. Start Development Server

```bash
# Start both frontend and backend
npm run dev

# This starts:
# - Backend server on http://localhost:5000
# - Frontend dev server with hot reload
# - Vite serves frontend and proxies API calls
```

## Development Tools

### Recommended VS Code Extensions

1. **TypeScript/JavaScript**
   - TypeScript and JavaScript Language Features (built-in)
   - Error Lens - for inline error highlighting

2. **React Development**
   - ES7+ React/Redux/React-Native snippets
   - Auto Rename Tag

3. **Database**
   - PostgreSQL - for database management
   - Database Client JDBC

4. **Code Quality**
   - ESLint - for code linting
   - Prettier - for code formatting
   - Tailwind CSS IntelliSense

5. **Git**
   - GitLens - for enhanced Git capabilities

### Database Management

#### Using VS Code Extension
1. Install PostgreSQL extension
2. Connect to your database:
   - Host: localhost
   - Port: 5432
   - Database: tally_dev
   - Username: tally_dev
   - Password: dev_password

#### Using Command Line
```bash
# Connect to database
psql -h localhost -U tally_dev -d tally_dev

# Common commands:
\dt              # List tables
\d table_name    # Describe table structure
SELECT * FROM users LIMIT 10;  # Query data
```

#### Using GUI Tools
- **pgAdmin** - Web-based PostgreSQL administration
- **DBeaver** - Universal database tool
- **TablePlus** - Modern database management tool

## Development Workflow

### 1. Branch Management
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### 2. Database Changes
```bash
# After modifying schema.ts
npm run db:push

# Generate migration (if needed)
npm run db:generate

# Reset database (development only)
npm run db:reset
```

### 3. Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- filename.test.ts
```

### 4. Code Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Build verification
npm run build
```

## Common Development Commands

### Package Management
```bash
# Add new dependency
npm install package-name

# Add development dependency
npm install -D package-name

# Remove dependency
npm uninstall package-name

# Update dependencies
npm update
```

### Database Operations
```bash
# Reset database and reseed
npm run db:reset

# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Studio (database GUI)
npm run db:studio
```

### Build and Deploy
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Start production server
npm start
```

## Troubleshooting Common Issues

### Port Already in Use
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=3000 npm run dev
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check if database exists
psql -h localhost -U tally_dev -l
```

### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Install/use correct version with nvm
nvm install 18
nvm use 18
```

### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```