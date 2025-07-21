#!/bin/bash

# Tally Development Deployment Script
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in development or production environment
if [[ -f "package.json" && -d "client" && -d "server" ]]; then
    print_status "Development environment detected"
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Building application..."
    npm run build
    
    print_status "Running database migrations..."
    npm run db:push
    
    print_status "Development deployment completed!"
    print_warning "To start the development server, run: npm run dev"
    
elif [[ -f "/opt/tally/package.json" ]]; then
    print_status "Production environment detected"
    
    cd /opt/tally
    
    print_status "Pulling latest code..."
    git pull origin main || print_warning "Git pull failed - continuing with local code"
    
    print_status "Installing dependencies..."
    npm ci --production
    
    print_status "Building application..."
    npm run build
    
    print_status "Running database migrations..."
    npm run db:push
    
    print_status "Restarting application..."
    pm2 restart tally || pm2 start ecosystem.config.js
    
    print_status "Reloading Nginx..."
    sudo systemctl reload nginx || print_warning "Nginx reload failed"
    
    print_success "Production deployment completed successfully!"
    
else
    print_error "Cannot determine environment. Please ensure you're in the project directory or have completed the installation."
    exit 1
fi