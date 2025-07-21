#!/bin/bash

# Tally Contact Management System - Ubuntu 24.04 Installation Script
# This script automates the deployment of Tally on Ubuntu 24.04 LTS

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
APP_NAME="tally"
APP_USER="tally"
APP_DIR="/opt/tally"
SERVICE_NAME="tally"
NGINX_CONF="/etc/nginx/sites-available/tally"
NODE_VERSION="20"
POSTGRES_VERSION="16"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running with sufficient privileges
check_privileges() {
    if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
        print_error "This script requires root privileges or sudo access."
        print_status "Please run as root or with sudo privileges: sudo ./install.sh"
        exit 1
    fi
    
    if [[ $EUID -eq 0 ]]; then
        print_status "Running as root user"
        SUDO_CMD=""
    else
        print_status "Running with sudo privileges"
        SUDO_CMD="sudo"
    fi
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    ${SUDO_CMD} apt update && ${SUDO_CMD} apt upgrade -y
    print_success "System packages updated"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js ${NODE_VERSION}..."
    
    # Install Node.js repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | ${SUDO_CMD} -E bash -
    ${SUDO_CMD} apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_success "Node.js ${node_version} and npm ${npm_version} installed"
}

# Function to install PostgreSQL
install_postgresql() {
    print_status "Installing PostgreSQL ${POSTGRES_VERSION}..."
    
    # Install PostgreSQL
    ${SUDO_CMD} apt install -y postgresql postgresql-contrib
    ${SUDO_CMD} systemctl start postgresql
    ${SUDO_CMD} systemctl enable postgresql
    
    print_success "PostgreSQL installed and started"
}

# Function to setup PostgreSQL database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create database and user
    ${SUDO_CMD} -u postgres psql -c "CREATE USER ${APP_USER} WITH PASSWORD '${DB_PASSWORD}';"
    ${SUDO_CMD} -u postgres psql -c "CREATE DATABASE ${APP_NAME} OWNER ${APP_USER};"
    ${SUDO_CMD} -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${APP_NAME} TO ${APP_USER};"
    
    # Save database credentials
    cat > /tmp/database_config.txt << EOF
Database Configuration:
- Database Name: ${APP_NAME}
- Username: ${APP_USER}
- Password: ${DB_PASSWORD}
- Host: localhost
- Port: 5432

Connection String:
postgresql://${APP_USER}:${DB_PASSWORD}@localhost:5432/${APP_NAME}
EOF
    
    print_success "Database created and configured"
    print_warning "Database credentials saved to /tmp/database_config.txt"
}

# Function to install Nginx
install_nginx() {
    print_status "Installing and configuring Nginx..."
    
    ${SUDO_CMD} apt install -y nginx
    ${SUDO_CMD} systemctl start nginx
    ${SUDO_CMD} systemctl enable nginx
    
    print_success "Nginx installed and started"
}

# Function to create application user
create_app_user() {
    print_status "Creating application user..."
    
    # Create system user for the application
    if ! id "$APP_USER" &>/dev/null; then
        ${SUDO_CMD} useradd --system --home-dir $APP_DIR --shell /bin/bash $APP_USER
        print_success "User $APP_USER created"
    else
        print_warning "User $APP_USER already exists"
    fi
}

# Function to setup application directory
setup_app_directory() {
    print_status "Setting up application directory..."
    
    # Create application directory
    ${SUDO_CMD} mkdir -p $APP_DIR
    ${SUDO_CMD} chown $APP_USER:$APP_USER $APP_DIR
    
    print_success "Application directory created at $APP_DIR"
}

# Function to install PM2 for process management
install_pm2() {
    print_status "Installing PM2 for process management..."
    
    ${SUDO_CMD} npm install -g pm2
    
    # Setup PM2 to start on boot
    ${SUDO_CMD} pm2 startup systemd -u $APP_USER --hp $APP_DIR
    
    print_success "PM2 installed and configured"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Create Nginx configuration
    ${SUDO_CMD} tee $NGINX_CONF > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Serve static files
    location /assets/ {
        alias /opt/tally/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy API requests and serve app
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Handle large file uploads
    client_max_body_size 10M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF
    
    # Enable the site
    ${SUDO_CMD} ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    ${SUDO_CMD} rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    ${SUDO_CMD} nginx -t
    ${SUDO_CMD} systemctl reload nginx
    
    print_success "Nginx configured and reloaded"
}

# Function to setup firewall
setup_firewall() {
    print_status "Configuring UFW firewall..."
    
    # Enable UFW if not already enabled
    ${SUDO_CMD} ufw --force enable
    
    # Allow SSH, HTTP, and HTTPS
    ${SUDO_CMD} ufw allow ssh
    ${SUDO_CMD} ufw allow 'Nginx Full'
    
    # Show firewall status
    ${SUDO_CMD} ufw status verbose
    
    print_success "Firewall configured"
}

# Function to create systemd service (backup to PM2)
create_systemd_service() {
    print_status "Creating systemd service as backup..."
    
    ${SUDO_CMD} tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << EOF
[Unit]
Description=Tally Contact Management System
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF
    
    ${SUDO_CMD} systemctl daemon-reload
    
    print_success "Systemd service created (backup to PM2)"
}

# Function to install SSL certificate with Let's Encrypt
install_ssl() {
    read -p "Do you want to install SSL certificate with Let's Encrypt? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Installing Certbot for SSL certificates..."
        
        ${SUDO_CMD} apt install -y certbot python3-certbot-nginx
        
        read -p "Enter your domain name (e.g., tally.yourdomain.com): " domain_name
        
        if [[ -n "$domain_name" ]]; then
            # Update Nginx config with domain
            ${SUDO_CMD} sed -i "s/server_name _;/server_name $domain_name;/" $NGINX_CONF
            ${SUDO_CMD} systemctl reload nginx
            
            # Get SSL certificate
            ${SUDO_CMD} certbot --nginx -d $domain_name --non-interactive --agree-tos --email admin@$domain_name
            
            print_success "SSL certificate installed for $domain_name"
        else
            print_warning "No domain provided, skipping SSL setup"
        fi
    fi
}

# Function to create deployment script
create_deployment_script() {
    print_status "Creating deployment script..."
    
    ${SUDO_CMD} tee ${APP_DIR}/deploy.sh > /dev/null << 'EOF'
#!/bin/bash

# Tally Deployment Script
set -e

APP_DIR="/opt/tally"
APP_USER="tally"

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

cd $APP_DIR

print_status "Pulling latest code..."
git pull origin main

print_status "Installing dependencies..."
npm ci --production

print_status "Building application..."
npm run build

print_status "Running database migrations..."
npm run db:push

print_status "Restarting application..."
pm2 restart tally || pm2 start ecosystem.config.js

print_status "Reloading Nginx..."
sudo systemctl reload nginx

print_success "Deployment completed successfully!"
EOF
    
    ${SUDO_CMD} chmod +x ${APP_DIR}/deploy.sh
    ${SUDO_CMD} chown $APP_USER:$APP_USER ${APP_DIR}/deploy.sh
    
    print_success "Deployment script created"
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    ${SUDO_CMD} -u $APP_USER tee ${APP_DIR}/ecosystem.config.js > /dev/null << 'EOF'
module.exports = {
  apps: [{
    name: 'tally',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
}
EOF
    
    # Create logs directory
    ${SUDO_CMD} -u $APP_USER mkdir -p ${APP_DIR}/logs
    
    print_success "PM2 configuration created"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    ${SUDO_CMD} tee /etc/logrotate.d/tally > /dev/null << EOF
${APP_DIR}/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 ${APP_USER} ${APP_USER}
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    print_success "Log rotation configured"
}

# Function to create backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    ${SUDO_CMD} tee /usr/local/bin/tally-backup.sh > /dev/null << 'EOF'
#!/bin/bash

# Tally Backup Script
BACKUP_DIR="/var/backups/tally"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/tally"
DB_NAME="tally"
DB_USER="tally"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/database_$DATE.sql

# Backup application files (excluding node_modules)
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /opt tally --exclude=node_modules --exclude=logs

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    ${SUDO_CMD} chmod +x /usr/local/bin/tally-backup.sh
    
    # Add to crontab for daily backups
    (${SUDO_CMD} crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/tally-backup.sh") | ${SUDO_CMD} crontab -
    
    print_success "Backup script created and scheduled"
}

# Function to display final instructions
show_final_instructions() {
    print_success "Installation completed successfully!"
    echo
    echo "==================================="
    echo "    TALLY INSTALLATION COMPLETE    "
    echo "==================================="
    echo
    print_status "Next Steps:"
    echo "1. Clone your application code to $APP_DIR"
    echo "2. Set up environment variables in $APP_DIR/.env"
    echo "3. Run the deployment script: $APP_DIR/deploy.sh"
    echo
    print_status "Important Files:"
    echo "- Application directory: $APP_DIR"
    echo "- Nginx configuration: $NGINX_CONF"
    echo "- PM2 configuration: $APP_DIR/ecosystem.config.js"
    echo "- Database credentials: /tmp/database_config.txt"
    echo "- Deployment script: $APP_DIR/deploy.sh"
    echo "- Backup script: /usr/local/bin/tally-backup.sh"
    echo
    print_status "Services:"
    echo "- Nginx: ${SUDO_CMD} systemctl {start|stop|restart|status} nginx"
    echo "- PostgreSQL: ${SUDO_CMD} systemctl {start|stop|restart|status} postgresql"
    echo "- Application: pm2 {start|stop|restart|status} tally"
    echo
    print_warning "Don't forget to:"
    echo "- Configure your domain name in Nginx"
    echo "- Set up environment variables"
    echo "- Configure database connection"
    echo "- Set up SSL certificate if needed"
    echo
    if [[ -f /tmp/database_config.txt ]]; then
        echo "Database configuration:"
        cat /tmp/database_config.txt
    fi
}

# Main installation function
main() {
    print_status "Starting Tally Contact Management System installation..."
    print_status "Target OS: Ubuntu 24.04 LTS"
    echo
    
    # Run installation steps
    check_privileges
    update_system
    install_nodejs
    install_postgresql
    setup_database
    install_nginx
    create_app_user
    setup_app_directory
    install_pm2
    configure_nginx
    setup_firewall
    create_systemd_service
    create_deployment_script
    create_pm2_config
    setup_log_rotation
    create_backup_script
    install_ssl
    
    show_final_instructions
}

# Run main function
main "$@"