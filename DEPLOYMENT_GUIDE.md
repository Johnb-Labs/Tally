# Tally Contact Management System - Deployment Guide

## Ubuntu 24.04 Automated Installation

This guide provides step-by-step instructions for deploying Tally on Ubuntu 24.04 LTS using the automated installation script.

## Prerequisites

- Ubuntu 24.04 LTS server (fresh installation recommended)
- Non-root user with sudo privileges
- Internet connection
- At least 2GB RAM and 20GB disk space
- Domain name (optional, for SSL setup)

## Quick Installation

### 1. Download and Run Installation Script

```bash
# Download the installation script
curl -O https://raw.githubusercontent.com/johnb-labs/tally/main/install.sh

# Make it executable
chmod +x install.sh

# Run the installation
sudo ./install.sh
```

### 2. Deploy Your Application

After installation, deploy your Tally application:

```bash
# Switch to application directory
cd tally

# Clone your repository (replace with your Git URL)
sudo -u tally git clone https://github.com/johnb-labs/tally.git .

# Create environment file
sudo -u tally cp .env.example .env
sudo -u tally nano .env

# Run deployment script
sudo ./deploy.sh
```

### 3. Configure Environment Variables

Edit the `.env` file with your specific configuration:

```bash
sudo -u tally nano tally/.env
```

Required environment variables:
```env
# Database Configuration
DATABASE_URL=postgresql://tally:YOUR_DB_PASSWORD@localhost:5432/tally
PGHOST=localhost
PGPORT=5432
PGDATABASE=tally
PGUSER=tally
PGPASSWORD=YOUR_DB_PASSWORD

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Replit Configuration (for OAuth)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.com
ISSUER_URL=https://replit.com/oidc

# Application Configuration
NODE_ENV=production
PORT:80
```

## What the Installation Script Does

### System Components Installed

1. **Node.js 20** - Runtime environment
2. **PostgreSQL 16** - Database server
3. **Nginx** - Web server and reverse proxy
4. **PM2** - Process manager for Node.js
5. **UFW Firewall** - Basic security setup
6. **Certbot** - SSL certificate management (optional)

### Security Configuration

- Creates dedicated system user (`tally`)
- Configures firewall rules (SSH, HTTP, HTTPS)
- Sets up proper file permissions
- Implements security headers in Nginx
- Isolates application processes

### Directory Structure

```
/opt/tally/                 # Application root
├── dist/                   # Built application
├── logs/                   # Application logs
├── uploads/               # File uploads
├── node_modules/          # Dependencies
├── ecosystem.config.js    # PM2 configuration
├── deploy.sh             # Deployment script
└── .env                  # Environment variables
```

### Services and Processes

- **Nginx**: Runs on port 80/443, proxies to application
- **PostgreSQL**: Database server on port 5432
- **Tally App**: Node.js application on port 5000 (internal)
- **PM2**: Process manager with clustering

## Manual Installation Steps

If you prefer manual installation or need to troubleshoot:

### 1. System Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Create Database
```bash
sudo -u postgres psql -c "CREATE USER tally WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE tally OWNER tally;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tally TO tally;"
```

### 5. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Create Application User
```bash
sudo useradd --system --home-dir /opt/tally --shell /bin/bash tally
sudo mkdir -p /opt/tally
sudo chown tally:tally /opt/tally
```

### 7. Install PM2
```bash
sudo npm install -g pm2
sudo pm2 startup systemd -u tally --hp /opt/tally
```

## SSL Certificate Setup

### Using Let's Encrypt (Automated)

The installation script can automatically set up SSL certificates:

1. Ensure your domain points to the server IP
2. Run the script and choose 'y' when prompted for SSL
3. Enter your domain name when requested

### Manual SSL Setup

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Application Deployment

### Initial Deployment

```bash
cd /opt/tally
sudo -u tally git clone YOUR_REPO_URL .
sudo -u tally npm ci --production
sudo -u tally npm run build
sudo -u tally npm run db:push
sudo -u tally pm2 start ecosystem.config.js
```

### Updating the Application

```bash
cd /opt/tally
./deploy.sh
```

## Monitoring and Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs tally

# System services
sudo systemctl status nginx
sudo systemctl status postgresql
```

### View Logs

```bash
# Application logs
tail -f /opt/tally/logs/combined.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Management

```bash
# Connect to database
sudo -u tally psql -d tally

# Create backup
pg_dump -U tally -h localhost tally > backup.sql

# Restore backup
psql -U tally -h localhost tally < backup.sql
```

## Backup and Restore

### Automated Backups

The installation script sets up daily automated backups:

- Database backups: `/var/backups/tally/database_*.sql`
- Application backups: `/var/backups/tally/app_*.tar.gz`
- Scheduled via cron at 2 AM daily
- Keeps 7 days of backups

### Manual Backup

```bash
# Run backup script manually
sudo /usr/local/bin/tally-backup.sh
```

### Restore from Backup

```bash
# Restore database
sudo -u tally psql -d tally < /var/backups/tally/database_YYYYMMDD_HHMMSS.sql

# Restore application files
cd /opt
sudo tar -xzf /var/backups/tally/app_YYYYMMDD_HHMMSS.tar.gz
sudo chown -R tally:tally /opt/tally
```

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   pm2 logs tally
   
   # Restart application
   pm2 restart tally
   ```

2. **Database connection errors**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   sudo -u tally psql -d tally -c "SELECT version();"
   ```

3. **Nginx errors**
   ```bash
   # Test configuration
   sudo nginx -t
   
   # Check error logs
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Permission issues**
   ```bash
   # Fix ownership
   sudo chown -R tally:tally /opt/tally
   
   # Fix permissions
   sudo chmod -R 755 /opt/tally
   ```

### Performance Optimization

1. **Database tuning**
   ```bash
   # Edit PostgreSQL configuration
   sudo nano /etc/postgresql/16/main/postgresql.conf
   
   # Common optimizations:
   shared_buffers = 256MB
   effective_cache_size = 1GB
   maintenance_work_mem = 64MB
   ```

2. **PM2 clustering**
   ```bash
   # Scale to use all CPU cores
   pm2 scale tally max
   ```

3. **Nginx caching**
   ```bash
   # Add to Nginx configuration
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## Security Hardening

### Additional Security Measures

1. **Firewall configuration**
   ```bash
   # Block all except necessary ports
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```

2. **Fail2Ban setup**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Automatic security updates**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

## Support and Updates

### Getting Help

- Check application logs for errors
- Review Nginx and PostgreSQL logs
- Consult the troubleshooting section
- Contact system administrator

### Keeping System Updated

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
cd /opt/tally
sudo -u tally npm update

# Rebuild application
./deploy.sh
```

This deployment guide provides comprehensive instructions for installing, configuring, and maintaining Tally on Ubuntu 24.04. Follow the steps carefully and refer to the troubleshooting section if you encounter any issues.
