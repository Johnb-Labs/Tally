# Deployment Guide

## Production Deployment Overview

This guide covers deploying Tally to a production environment with proper security, performance, and monitoring configurations.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ LTS or CentOS 8+
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 20GB disk space
- **CPU**: 2+ cores recommended
- **Network**: Public IP address and domain name

### Required Software
- **Node.js**: Version 18+ LTS
- **PostgreSQL**: Version 12+
- **Nginx**: For reverse proxy and SSL termination
- **PM2**: For process management
- **Certbot**: For SSL certificates

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common

# Create application user
sudo adduser tally
sudo usermod -aG sudo tally

# Switch to application user
sudo su - tally
```

### 2. Install Node.js

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -i -u postgres
psql

CREATE DATABASE tally_production;
CREATE USER tally_user WITH ENCRYPTED PASSWORD 'secure_production_password_here';
GRANT ALL PRIVILEGES ON DATABASE tally_production TO tally_user;
ALTER USER tally_user CREATEDB;
\q
exit
```

### 4. Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Allow HTTP and HTTPS through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### 5. Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
# Follow the instructions PM2 provides
```

## Application Deployment

### 1. Clone and Setup Application

```bash
# Clone repository
cd /home/tally
git clone https://github.com/yourusername/tally-app.git
cd tally-app

# Install dependencies
npm install

# Install production dependencies only
npm ci --only=production
```

### 2. Environment Configuration

```bash
# Create production environment file
nano .env.production
```

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://tally_user:secure_production_password_here@localhost:5432/tally_production
PGHOST=localhost
PGPORT=5432
PGDATABASE=tally_production
PGUSER=tally_user
PGPASSWORD=secure_production_password_here

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters

# Application
DOMAIN=your-domain.com
ADMIN_EMAIL=admin@your-domain.com

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=/home/tally/tally-app/uploads
```

### 3. Database Initialization

```bash
# Set environment for database operations
export NODE_ENV=production

# Apply database migrations
npm run db:push

# Create admin user (optional)
npm run create-admin
```

### 4. Build Application

```bash
# Build frontend and backend for production
npm run build

# Test production build locally
npm start
# Verify app runs on http://localhost:3000
# Stop with Ctrl+C
```

### 5. PM2 Process Management

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'tally-app',
    script: 'dist/index.js',
    cwd: '/home/tally/tally-app',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: '/home/tally/logs/tally-error.log',
    out_file: '/home/tally/logs/tally-out.log',
    log_file: '/home/tally/logs/tally-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

```bash
# Create logs directory
mkdir -p /home/tally/logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check application status
pm2 status
pm2 logs tally-app
```

## Nginx Configuration

### 1. Create Nginx Site Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/tally-app
```

```nginx
# /etc/nginx/sites-available/tally-app
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (will be added by Certbot)
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # File Upload Size
    client_max_body_size 10M;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static file caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

### 2. Enable Site and Configure Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tally-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## SSL Certificate Setup

### 1. Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify automatic renewal
sudo certbot renew --dry-run
```

### 2. Configure Automatic Certificate Renewal

```bash
# Add cron job for certificate renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## Database Backup and Monitoring

### 1. Database Backup Script

```bash
# Create backup script
nano /home/tally/scripts/backup-database.sh
```

```bash
#!/bin/bash
# /home/tally/scripts/backup-database.sh

BACKUP_DIR="/home/tally/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="tally_production"
DB_USER="tally_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/tally_backup_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/tally_backup_$TIMESTAMP.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "tally_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: tally_backup_$TIMESTAMP.sql.gz"
```

```bash
# Make script executable
chmod +x /home/tally/scripts/backup-database.sh

# Add to crontab for daily backups
crontab -e

# Add this line for daily backup at 2 AM:
0 2 * * * /home/tally/scripts/backup-database.sh
```

### 2. Application Monitoring

```bash
# Create monitoring script
nano /home/tally/scripts/monitor-app.sh
```

```bash
#!/bin/bash
# /home/tally/scripts/monitor-app.sh

# Check if app is running
if ! pm2 list | grep -q "tally-app.*online"; then
    echo "Application is down, restarting..."
    pm2 restart tally-app
fi

# Check disk space
DISK_USAGE=$(df /home/tally | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Warning: Disk usage is at ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "Warning: Memory usage is at ${MEMORY_USAGE}%"
fi
```

```bash
# Make script executable
chmod +x /home/tally/scripts/monitor-app.sh

# Add to crontab for monitoring every 5 minutes
crontab -e

# Add this line:
*/5 * * * * /home/tally/scripts/monitor-app.sh
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # Block direct access to Node.js
sudo ufw enable
```

### 2. Fail2Ban for SSH Protection

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure Fail2Ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
```

```bash
# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 3. PostgreSQL Security

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/12/main/postgresql.conf

# Ensure these settings:
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Edit pg_hba.conf for connection security
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Ensure this line is present:
local   all             tally_user                              md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Application Updates

### 1. Update Deployment Script

```bash
# Create update script
nano /home/tally/scripts/deploy-update.sh
```

```bash
#!/bin/bash
# /home/tally/scripts/deploy-update.sh

APP_DIR="/home/tally/tally-app"
BACKUP_DIR="/home/tally/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

cd $APP_DIR

# Create backup
echo "Creating backup..."
/home/tally/scripts/backup-database.sh

# Stop application
echo "Stopping application..."
pm2 stop tally-app

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Build application
echo "Building application..."
npm run build

# Start application
echo "Starting application..."
pm2 start tally-app

# Check status
echo "Checking application status..."
pm2 status tally-app

echo "Deployment completed successfully!"
```

```bash
# Make script executable
chmod +x /home/tally/scripts/deploy-update.sh
```

## Performance Optimization

### 1. Node.js Optimization

```javascript
// ecosystem.config.js - Production optimizations
module.exports = {
  apps: [{
    name: 'tally-app',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    node_args: [
      '--max-old-space-size=1024',
      '--optimize-for-size'
    ],
    env: {
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: 128
    }
  }]
};
```

### 2. Database Optimization

```sql
-- Database performance tuning
-- Connect to PostgreSQL as superuser

-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Reload configuration
SELECT pg_reload_conf();

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_contacts_division_search 
ON contacts(division_id, last_name, first_name);

CREATE INDEX CONCURRENTLY idx_audit_logs_user_date 
ON audit_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_uploads_status_date 
ON uploads(status, created_at DESC);
```

## Troubleshooting

### Common Issues and Solutions

1. **Application won't start**
   ```bash
   # Check logs
   pm2 logs tally-app
   
   # Check port availability
   sudo netstat -tlnp | grep 3000
   
   # Restart application
   pm2 restart tally-app
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test database connection
   psql -h localhost -U tally_user -d tally_production
   
   # Check PostgreSQL logs
   sudo tail -f /var/log/postgresql/postgresql-12-main.log
   ```

3. **SSL certificate issues**
   ```bash
   # Test certificate renewal
   sudo certbot renew --dry-run
   
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificates manually
   sudo certbot renew
   ```

4. **High memory usage**
   ```bash
   # Check memory usage
   free -h
   pm2 monit
   
   # Restart application
   pm2 restart tally-app
   
   # Optimize Node.js memory
   pm2 delete tally-app
   pm2 start ecosystem.config.js
   ```

### Log Locations

- **Application logs**: `/home/tally/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **PostgreSQL logs**: `/var/log/postgresql/`
- **System logs**: `/var/log/syslog`

### Health Checks

```bash
# Check all services
sudo systemctl status nginx postgresql

# Check application
pm2 status
curl -I https://your-domain.com

# Check database
psql -h localhost -U tally_user -d tally_production -c "SELECT version();"

# Check disk space
df -h

# Check memory
free -h
```