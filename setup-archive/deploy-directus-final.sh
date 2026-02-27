#!/bin/bash

# Final Directus Auto-Deploy Script for Ubuntu Server
set -e

echo "🚀 Starting Directus Auto-Deployment (Final)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get VPS IP
VPS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
print_status "Detected VPS IP: $VPS_IP"

# Find available port
print_status "Finding available port..."
PORT=8055
while netstat -ln | grep -q ":$PORT "; do
    PORT=$((PORT + 1))
done
print_success "Using port: $PORT"

# Create directory
print_status "Creating directory..."
mkdir -p ~/directus-admin
cd ~/directus-admin
mkdir -p directus-data/{db,redis,uploads,extensions}

# Generate keys
print_status "Generating secure keys..."
SECRET_KEY=$(openssl rand -hex 32)
SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)

# Create environment file
print_status "Creating environment..."
cat > .env.directus << EOF
DIRECTUS_PORT=$PORT
DIRECTUS_DB_PASSWORD=$DB_PASSWORD
DIRECTUS_SECRET_KEY=$SECRET_KEY
DIRECTUS_SECRET=$SECRET
DIRECTUS_ADMIN_EMAIL=admin@asha.news
DIRECTUS_ADMIN_PASSWORD=$ADMIN_PASSWORD
DIRECTUS_PUBLIC_URL=http://$VPS_IP:$PORT
DIRECTUS_CORS_ORIGIN=http://localhost:3000,https://asha.news,https://www.asha.news
EOF

# Create Docker Compose with correct syntax
print_status "Creating Docker configuration..."
cat > docker-compose.directus.yml << 'EOF'
version: '3.8'

services:
  directus-db:
    image: postgres:15-alpine
    container_name: directus-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: ${DIRECTUS_DB_PASSWORD}
    volumes:
      - ./directus-data/db:/var/lib/postgresql/data
    networks:
      - directus-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U directus"]
      interval: 10s
      timeout: 5s
      retries: 5

  directus-redis:
    image: redis:7-alpine
    container_name: directus-redis
    restart: unless-stopped
    volumes:
      - ./directus-data/redis:/data
    networks:
      - directus-network

  directus:
    image: directus/directus:latest
    container_name: directus-app
    restart: unless-stopped
    ports:
      - "${DIRECTUS_PORT}:8055"
    environment:
      DB_CLIENT: pg
      DB_HOST: directus-db
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: ${DIRECTUS_DB_PASSWORD}
      CACHE_ENABLED: "true"
      CACHE_STORE: redis
      REDIS: redis://directus-redis:6379
      KEY: ${DIRECTUS_SECRET_KEY}
      SECRET: ${DIRECTUS_SECRET}
      ADMIN_EMAIL: ${DIRECTUS_ADMIN_EMAIL}
      ADMIN_PASSWORD: ${DIRECTUS_ADMIN_PASSWORD}
      PUBLIC_URL: ${DIRECTUS_PUBLIC_URL}
      CORS_ENABLED: "true"
      CORS_ORIGIN: ${DIRECTUS_CORS_ORIGIN}
      STORAGE_LOCATIONS: local
      STORAGE_LOCAL_ROOT: ./uploads
      LOG_LEVEL: info
    volumes:
      - ./directus-data/uploads:/directus/uploads
      - ./directus-data/extensions:/directus/extensions
    networks:
      - directus-network
    depends_on:
      directus-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8055/server/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

networks:
  directus-network:
    driver: bridge
EOF

print_success "Configuration created"

# Deploy
print_status "Deploying Directus..."
docker-compose -f docker-compose.directus.yml --env-file .env.directus up -d

# Wait and check
print_status "Waiting for services..."
sleep 45

if docker-compose -f docker-compose.directus.yml ps | grep -q "Up"; then
    print_success "Directus deployed successfully!"
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "=================================="
    echo "Admin Panel URL: http://$VPS_IP:$PORT"
    echo "Admin Email: admin@asha.news"
    echo "Admin Password: $ADMIN_PASSWORD"
    echo "=================================="
    echo ""
    echo "📋 SAVE THESE CREDENTIALS:"
    echo "Database Password: $DB_PASSWORD"
    echo "Secret Key: $SECRET_KEY"
    echo "Secret: $SECRET"
    echo ""
else
    print_error "Deployment failed. Check logs:"
    docker logs directus-app
    exit 1
fi

print_success "🚀 Directus is ready!"
