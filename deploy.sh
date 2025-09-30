#!/bin/bash

# Tally Deployment Script - Fully Automated
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AUTO_START=${AUTO_START:-true}
DEPLOY_ENV=${DEPLOY_ENV:-development}
SKIP_DEPS=${SKIP_DEPS:-false}
SKIP_BUILD=${SKIP_BUILD:-false}

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

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-auto-start)
            AUTO_START=false
            shift
            ;;
        --production|--prod)
            DEPLOY_ENV=production
            shift
            ;;
        --development|--dev)
            DEPLOY_ENV=development
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help|-h)
            echo "Tally Deployment Script"
            echo
            echo "Usage: ./deploy.sh [options]"
            echo
            echo "Options:"
            echo "  --dev, --development    Deploy in development mode (default)"
            echo "  --prod, --production    Deploy in production mode"
            echo "  --no-auto-start        Don't automatically start the server"
            echo "  --skip-deps            Skip npm install"
            echo "  --skip-build           Skip build step"
            echo "  -h, --help             Show this help message"
            echo
            echo "Environment Variables:"
            echo "  AUTO_START=false       Disable auto-start"
            echo "  DEPLOY_ENV=production  Set deployment environment"
            echo
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Ensure we're in the project root
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if we're in development or production environment
if [[ -f "package.json" && -d "client" && -d "server" ]]; then
    print_status "Development environment detected"
    print_status "Working directory: $(pwd)"
    print_status "Deploy environment: $DEPLOY_ENV"
    print_status "Auto-start: $AUTO_START"
    
    if [[ "$SKIP_DEPS" != "true" ]]; then
        print_status "Installing dependencies..."
        npm install
    else
        print_warning "Skipping dependency installation"
    fi
    
    if [[ "$SKIP_BUILD" != "true" ]]; then
        print_status "Building application..."
        npm run build
    else
        print_warning "Skipping build step"
    fi
    
    print_status "Running database migrations..."
    npm run db:push
    
    print_success "Build and migration completed!"
    
    # Auto-start logic
    if [[ "$AUTO_START" == "true" ]]; then
        print_status "Auto-starting application..."
        
        # Check if we're on Replit (has .replit file)
        if [[ -f ".replit" ]]; then
            print_status "Replit environment detected - server will auto-restart via workflow"
            print_success "Deployment completed! Server restarting automatically..."
        else
            # Local or server environment
            if [[ "$DEPLOY_ENV" == "production" ]]; then
                # Try PM2 first
                if command -v pm2 &> /dev/null; then
                    print_status "Starting with PM2..."
                    if pm2 list | grep -q "tally"; then
                        pm2 restart tally
                        print_success "Application restarted with PM2"
                    else
                        pm2 start ecosystem.config.js
                        print_success "Application started with PM2"
                    fi
                else
                    print_status "Starting production server..."
                    NODE_ENV=production node dist/index.js &
                    print_success "Production server started (PID: $!)"
                fi
            else
                # Development mode
                if pgrep -f "npm run dev" > /dev/null; then
                    print_status "Development server already running, killing..."
                    pkill -f "npm run dev" || true
                    sleep 2
                fi
                
                print_status "Starting development server..."
                npm run dev > /tmp/tally-dev.log 2>&1 &
                DEV_PID=$!
                print_success "Development server started (PID: $DEV_PID)"
                print_status "Logs: tail -f /tmp/tally-dev.log"
            fi
        fi
    else
        print_warning "Auto-start disabled. Start the application manually:"
        echo "  - Development: npm run dev"
        echo "  - Production: pm2 start ecosystem.config.js"
    fi
    
elif [[ -f "/opt/tally/package.json" ]]; then
    print_status "Production environment detected"
    
    cd /opt/tally
    print_status "Working directory: $(pwd)"
    
    print_status "Pulling latest code..."
    git pull origin main || print_warning "Git pull failed - continuing with local code"
    
    print_status "Installing dependencies..."
    npm ci --production
    
    print_status "Building application..."
    npm run build
    
    print_status "Running database migrations..."
    npm run db:push
    
    print_status "Restarting application..."
    if pm2 list | grep -q "tally"; then
        pm2 restart tally
    else
        pm2 start ecosystem.config.js
    fi
    
    print_status "Reloading Nginx..."
    sudo systemctl reload nginx || print_warning "Nginx reload failed"
    
    print_success "Production deployment completed successfully!"
    
else
    print_error "Cannot determine environment. Please ensure you're in the project directory or have completed the installation."
    exit 1
fi