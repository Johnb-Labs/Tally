# Tally by JBLabs

> A modern, white-label contact management system with role-based access control, division management, and responsive design.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)

## 🚀 Features

### Core Functionality
- **📊 Contact Management** - Comprehensive contact database with flexible field mapping
- **📁 Multi-Format Import** - Support for Excel (.xlsx, .xls), CSV, and SQL database imports
- **🏢 Division Management** - Multi-tenant organization with division-based data isolation
- **👥 Role-Based Access** - Admin, Uploader, Executive, and User roles with granular permissions
- **🎨 White-Label Branding** - Customizable logos, colors, and organization name per division
- **📱 Responsive Design** - Optimized for mobile, tablet, and desktop devices

### Import & Export
- **Excel/CSV Import** - Drag-and-drop file upload with intelligent field mapping
- **SQL Database Import** - Connect to MySQL, PostgreSQL, or MS SQL Server with read-only access
- **Auto-Mapping** - Intelligent column-to-field matching based on header patterns
- **Data Validation** - Comprehensive validation and error handling during import
- **Export Reports** - Export data and analytics for external use

### Security & Compliance
- **Audit Logging** - Complete activity tracking for all data modifications
- **Session Management** - Secure PostgreSQL-backed sessions
- **Role-Based Permissions** - Fine-grained access control by role and division
- **SQL Query Validation** - Strict security for database imports (no DDL/DML)

### Analytics & Reporting
- **Interactive Dashboards** - Contact growth charts and statistics
- **Company-Wide Analytics** - Executive view across all divisions
- **Visual Reports** - Chart.js integration for data visualization
- **Contact Distribution** - Analytics by categories and divisions

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling with dark mode support
- **shadcn/ui** + Radix UI component library
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **Chart.js** for data visualization

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Drizzle ORM
- **Zod** for validation schemas
- **Replit Auth** with OpenID Connect
- **Multer** for file uploads
- **PM2** for process management (production)

### Database Clients
- **PostgreSQL** - Neon serverless driver
- **MySQL** - mysql2 client
- **MS SQL Server** - mssql client

## 📦 Installation

### Prerequisites
- Node.js 20 or higher
- PostgreSQL 16 or higher
- npm or yarn

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd tally
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Run database migrations**
```bash
npm run db:push
```

5. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Deployment

#### Quick Deploy
```bash
./deploy.sh --prod
```

#### Server Installation (Ubuntu 24.04)
```bash
sudo ./install.sh
```

This automated script will:
- Install Node.js, PostgreSQL, and Nginx
- Create database and system user
- Configure firewall and SSL
- Set up PM2 process manager
- Configure log rotation and backups

## 🚢 Deployment

### Automated Deployment Script

The included deployment script handles building, migrating, and starting the application.

**Basic usage:**
```bash
# Development deployment
./deploy.sh

# Production deployment
./deploy.sh --prod

# Quick update (skip dependencies)
./deploy.sh --skip-deps

# Build only (no auto-start)
./deploy.sh --no-auto-start
```

**Available options:**
- `--dev`, `--development` - Deploy in development mode (default)
- `--prod`, `--production` - Deploy in production mode
- `--no-auto-start` - Don't automatically start the server
- `--skip-deps` - Skip npm install
- `--skip-build` - Skip build step
- `-h`, `--help` - Show help message

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/tally
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secret-key
```

## 📱 Responsive Design

Tally is fully responsive with optimized layouts for:
- **Mobile** (< 640px) - Hamburger menu with slide-out navigation
- **Tablet** (640px - 1024px) - Adaptive grid layouts
- **Desktop** (> 1024px) - Full sidebar with persistent navigation

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, branding |
| **Executive (Exco)** | Company-wide dashboard, view all divisions |
| **Uploader** | Upload files, view assigned divisions |
| **User** | View contacts in assigned divisions |

## 📊 Database Schema

- **Users** - Role-based authentication and profiles
- **Divisions** - Multi-tenant organization structure
- **Contacts** - Main contact data with flexible fields
- **Uploads** - File upload tracking
- **Audit Logs** - Activity tracking and compliance
- **Sessions** - Secure session storage

## 🔧 Development

### Project Structure
```
tally/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and helpers
│   │   └── hooks/       # Custom React hooks
├── server/              # Backend Express application
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   └── auth.ts          # Authentication logic
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle schema and Zod validators
├── deploy.sh            # Automated deployment script
└── install.sh           # Server installation script
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

### Code Quality

The project uses:
- **TypeScript** for type safety
- **Zod** for runtime validation
- **Drizzle ORM** for type-safe database queries
- **ESBuild** for fast production builds

## 🌍 Localization

Currently localized for South Africa:
- Address format (province, postal code)
- Phone number format (+27)
- CSV templates with South African data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Replit](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide React](https://lucide.dev)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: JBLabs

---

**Built with ❤️ by JBLabs**
