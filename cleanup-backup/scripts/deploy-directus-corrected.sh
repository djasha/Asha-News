#!/bin/bash

# Directus Docker Deployment Script - Corrected Version
# Based on official Directus API documentation

set -e

# Colors for output
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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Generate secure random string
generate_secret() {
    openssl rand -hex 32
}

# Generate secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Detect server IP
detect_ip() {
    # Try multiple methods to get external IP
    IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "localhost")
    echo $IP
}

# Find available port starting from 8055
find_available_port() {
    local port=8055
    while netstat -tuln | grep -q ":$port "; do
        ((port++))
    done
    echo $port
}

print_status "Starting Directus deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Detect server configuration
SERVER_IP=$(detect_ip)
DIRECTUS_PORT=$(find_available_port)

print_status "Detected server IP: $SERVER_IP"
print_status "Using port: $DIRECTUS_PORT"

# Create deployment directory
DEPLOY_DIR="$HOME/directus-admin"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Generate secure credentials
DB_PASSWORD=$(generate_password)
SECRET_KEY=$(generate_secret)
ADMIN_PASSWORD=$(generate_password)

print_status "Generating environment configuration..."

# Create .env.directus file with correct variables based on API docs
cat > .env.directus << EOF
# === REQUIRED CORE VARIABLES ===
SECRET=$SECRET_KEY
PUBLIC_URL=http://$SERVER_IP:$DIRECTUS_PORT

# === DATABASE CONFIGURATION ===
DB_CLIENT=pg
DB_HOST=directus-postgres
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=$DB_PASSWORD

# === ADMIN USER ===
ADMIN_EMAIL=admin@asha.news
ADMIN_PASSWORD=$ADMIN_PASSWORD

# === CACHE CONFIGURATION ===
CACHE_ENABLED=true
CACHE_AUTO_PURGE=true
CACHE_STORE=redis
REDIS=redis://directus-redis:6379

# === CORS CONFIGURATION ===
CORS_ENABLED=true
CORS_ORIGIN=true

# === SECURITY ===
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
REFRESH_TOKEN_COOKIE_SECURE=false
REFRESH_TOKEN_COOKIE_SAME_SITE=lax

# === RATE LIMITING ===
RATE_LIMITER_ENABLED=true
RATE_LIMITER_POINTS=25
RATE_LIMITER_DURATION=1

# === FILE UPLOADS ===
FILES_MAX_UPLOAD_SIZE=100MB

# === EMAIL (Optional - can be configured later) ===
# EMAIL_FROM=noreply@asha.news
# EMAIL_TRANSPORT=smtp

# === TELEMETRY ===
TELEMETRY=false

# === POSTGRES ENVIRONMENT ===
POSTGRES_USER=directus
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=directus
EOF

print_status "Creating Docker Compose configuration..."

# Create docker-compose.directus.yml with corrected configuration
cat > docker-compose.directus.yml << 'EOF'
version: '3.8'

services:
  directus-postgres:
    image: postgis/postgis:13-master
    container_name: directus-postgres
    restart: unless-stopped
    volumes:
      - ./directus-data/db:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD", "pg_isready", "--host=localhost", "--username=${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - directus-network

  directus-redis:
    image: redis:6-alpine
    container_name: directus-redis
    restart: unless-stopped
    volumes:
      - ./directus-data/redis:/data
    healthcheck:
      test: ["CMD-SHELL", "[ $$(redis-cli ping) = 'PONG' ]"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - directus-network

  directus-app:
    image: directus/directus:latest
    container_name: directus-app
    restart: unless-stopped
    ports:
      - "${DIRECTUS_PORT:-8055}:8055"
    volumes:
      - ./directus-data/uploads:/directus/uploads
      - ./directus-data/extensions:/directus/extensions
    depends_on:
      directus-postgres:
        condition: service_healthy
      directus-redis:
        condition: service_healthy
    environment:
      # Core
      SECRET: ${SECRET}
      PUBLIC_URL: ${PUBLIC_URL}
      
      # Database
      DB_CLIENT: ${DB_CLIENT}
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      DB_DATABASE: ${DB_DATABASE}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      
      # Admin User
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      
      # Cache
      CACHE_ENABLED: ${CACHE_ENABLED}
      CACHE_AUTO_PURGE: ${CACHE_AUTO_PURGE}
      CACHE_STORE: ${CACHE_STORE}
      REDIS: ${REDIS}
      
      # CORS
      CORS_ENABLED: ${CORS_ENABLED}
      CORS_ORIGIN: ${CORS_ORIGIN}
      
      # Security
      ACCESS_TOKEN_TTL: ${ACCESS_TOKEN_TTL}
      REFRESH_TOKEN_TTL: ${REFRESH_TOKEN_TTL}
      REFRESH_TOKEN_COOKIE_SECURE: ${REFRESH_TOKEN_COOKIE_SECURE}
      REFRESH_TOKEN_COOKIE_SAME_SITE: ${REFRESH_TOKEN_COOKIE_SAME_SITE}
      
      # Rate Limiting
      RATE_LIMITER_ENABLED: ${RATE_LIMITER_ENABLED}
      RATE_LIMITER_POINTS: ${RATE_LIMITER_POINTS}
      RATE_LIMITER_DURATION: ${RATE_LIMITER_DURATION}
      
      # Files
      FILES_MAX_UPLOAD_SIZE: ${FILES_MAX_UPLOAD_SIZE}
      
      # Telemetry
      TELEMETRY: ${TELEMETRY}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8055/server/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - directus-network

networks:
  directus-network:
    driver: bridge

volumes:
  directus_db_data:
  directus_redis_data:
  directus_uploads:
  directus_extensions:
EOF

# Add DIRECTUS_PORT to environment file
echo "DIRECTUS_PORT=$DIRECTUS_PORT" >> .env.directus

print_status "Creating data directories..."
mkdir -p directus-data/{db,redis,uploads,extensions}

print_status "Deploying Directus containers..."
docker-compose -f docker-compose.directus.yml --env-file .env.directus up -d

print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow $DIRECTUS_PORT/tcp
    print_success "Firewall rule added for port $DIRECTUS_PORT"
fi

print_status "Creating backup script..."
cat > backup-directus.sh << EOF
#!/bin/bash
# Directus Database Backup Script
BACKUP_DIR="\$HOME/directus-backups"
mkdir -p "\$BACKUP_DIR"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
docker exec directus-postgres pg_dump -U directus directus > "\$BACKUP_DIR/directus_backup_\$TIMESTAMP.sql"
echo "Backup created: \$BACKUP_DIR/directus_backup_\$TIMESTAMP.sql"
EOF
chmod +x backup-directus.sh

print_success "Directus deployment completed!"
echo ""
echo "=== DEPLOYMENT SUMMARY ==="
echo "Directus URL: http://$SERVER_IP:$DIRECTUS_PORT"
echo "Admin Email: admin@asha.news"
echo "Admin Password: $ADMIN_PASSWORD"
echo ""
echo "=== IMPORTANT ==="
echo "Please save the admin password above!"
echo "Database password: $DB_PASSWORD"
echo "Secret key: $SECRET_KEY"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Wait 2-3 minutes for containers to fully start"
echo "2. Check container status: docker-compose -f docker-compose.directus.yml ps"
echo "3. View logs: docker logs directus-app -f"
echo "4. Access admin panel: http://$SERVER_IP:$DIRECTUS_PORT"
echo ""
echo "=== BACKUP ==="
echo "Run ./backup-directus.sh to create database backups"
