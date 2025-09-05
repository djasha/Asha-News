#!/bin/bash

# Directus Auto-Deploy Script for Ubuntu Server
# This script does everything automatically

set -e  # Exit on any error

echo "🚀 Starting Directus Auto-Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Get VPS IP automatically
VPS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
print_status "Detected VPS IP: $VPS_IP"

# Check system requirements
print_status "Checking system requirements..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo usermod -aG docker $USER
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi

# Check available memory
MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
if [ "$MEMORY_GB" -lt 2 ]; then
    print_warning "Only ${MEMORY_GB}GB RAM available. Directus needs at least 2GB."
    print_status "Reducing memory limits to fit your server..."
fi

# Find available port
print_status "Finding available port..."
PORT=8055
while netstat -ln | grep -q ":$PORT "; do
    PORT=$((PORT + 1))
    print_status "Port $((PORT - 1)) is taken, trying $PORT..."
done
print_success "Using port: $PORT"

# Create isolated directory
print_status "Creating isolated directory..."
mkdir -p ~/directus-admin
cd ~/directus-admin
mkdir -p directus-data/{db,redis,uploads,extensions}
print_success "Directory structure created"

# Generate secure keys automatically
print_status "Generating secure keys..."
SECRET_KEY=$(openssl rand -hex 32)
SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)

print_success "Secure keys generated"

# Create environment file automatically
print_status "Creating environment configuration..."
cat > .env.directus << EOF
# Auto-generated Directus Configuration
DIRECTUS_PORT=$PORT
DIRECTUS_DB_PASSWORD=$DB_PASSWORD
DIRECTUS_SECRET_KEY=$SECRET_KEY
DIRECTUS_SECRET=$SECRET
DIRECTUS_ADMIN_EMAIL=admin@asha.news
DIRECTUS_ADMIN_PASSWORD=$ADMIN_PASSWORD
DIRECTUS_PUBLIC_URL=http://$VPS_IP:$PORT
DIRECTUS_CORS_ORIGIN=http://localhost:3000,https://asha.news,https://www.asha.news
DIRECTUS_EMAIL_FROM=no-reply@asha.news
DIRECTUS_SMTP_HOST=
DIRECTUS_SMTP_PORT=587
DIRECTUS_SMTP_USER=
DIRECTUS_SMTP_PASSWORD=
EOF

print_success "Environment configured"

# Adjust memory limits based on available RAM
if [ "$MEMORY_GB" -lt 4 ]; then
    MEMORY_LIMIT="512M"
    CPU_LIMIT="0.25"
else
    MEMORY_LIMIT="1G"
    CPU_LIMIT="0.5"
fi

# Create Docker Compose file with dynamic memory limits
print_status "Creating Docker configuration..."
cat > docker-compose.directus.yml << EOF
version: '3.8'

services:
  directus-db:
    image: postgres:15-alpine
    container_name: directus-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: \${DIRECTUS_DB_PASSWORD}
    volumes:
      - directus_db_data:/var/lib/postgresql/data
    networks:
      - directus-isolated
    ports: []
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U directus"]
      interval: 30s
      timeout: 10s
      retries: 5

  directus-redis:
    image: redis:7-alpine
    container_name: directus-redis
    restart: unless-stopped
    volumes:
      - directus_redis_data:/data
    networks:
      - directus-isolated
    ports: []
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  directus:
    image: directus/directus:latest
    container_name: directus-app
    restart: unless-stopped
    ports:
      - "\${DIRECTUS_PORT}:8055"
    environment:
      DB_CLIENT: pg
      DB_HOST: directus-db
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: \${DIRECTUS_DB_PASSWORD}
      CACHE_ENABLED: true
      CACHE_STORE: redis
      REDIS: redis://directus-redis:6379
      KEY: \${DIRECTUS_SECRET_KEY}
      SECRET: \${DIRECTUS_SECRET}
      ADMIN_EMAIL: \${DIRECTUS_ADMIN_EMAIL}
      ADMIN_PASSWORD: \${DIRECTUS_ADMIN_PASSWORD}
      PUBLIC_URL: \${DIRECTUS_PUBLIC_URL}
      CORS_ENABLED: true
      CORS_ORIGIN: \${DIRECTUS_CORS_ORIGIN}
      STORAGE_LOCATIONS: local
      STORAGE_LOCAL_ROOT: ./uploads
      EMAIL_FROM: \${DIRECTUS_EMAIL_FROM}
      EMAIL_TRANSPORT: smtp
      EMAIL_SMTP_HOST: \${DIRECTUS_SMTP_HOST}
      EMAIL_SMTP_PORT: \${DIRECTUS_SMTP_PORT}
      EMAIL_SMTP_USER: \${DIRECTUS_SMTP_USER}
      EMAIL_SMTP_PASSWORD: \${DIRECTUS_SMTP_PASSWORD}
      LOG_LEVEL: info
      LOG_STYLE: pretty
      NODE_OPTIONS: "--max-old-space-size=512"
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions
    networks:
      - directus-isolated
    depends_on:
      directus-db:
        condition: service_healthy
      directus-redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8055/server/health"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          memory: $MEMORY_LIMIT
          cpus: '$CPU_LIMIT'
        reservations:
          memory: 256M
          cpus: '0.1'

volumes:
  directus_db_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: \${PWD}/directus-data/db
  directus_redis_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: \${PWD}/directus-data/redis
  directus_uploads:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: \${PWD}/directus-data/uploads
  directus_extensions:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: \${PWD}/directus-data/extensions

networks:
  directus-isolated:
    driver: bridge
    name: directus-network
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF

print_success "Docker configuration created"

# Pull Docker images
print_status "Downloading Docker images..."
docker pull directus/directus:latest
docker pull postgres:15-alpine
docker pull redis:7-alpine
print_success "Images downloaded"

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow $PORT
    print_success "Firewall configured for port $PORT"
else
    print_warning "UFW not found, please manually open port $PORT"
fi

# Deploy Directus
print_status "Deploying Directus..."
docker-compose -f docker-compose.directus.yml --env-file .env.directus up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
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
    echo "🔧 Management Commands:"
    echo "View logs: docker logs directus-app -f"
    echo "Restart: docker-compose -f docker-compose.directus.yml restart"
    echo "Stop: docker-compose -f docker-compose.directus.yml down"
    echo ""
    
    # Test health endpoint
    if curl -s http://localhost:$PORT/server/health > /dev/null; then
        print_success "Health check passed - Directus is running!"
    else
        print_warning "Health check failed - check logs: docker logs directus-app"
    fi
    
else
    print_error "Deployment failed. Check logs:"
    docker logs directus-app
    exit 1
fi

print_status "Creating backup script..."
cat > backup-directus.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="~/directus-backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/directus-backup-$(date +%Y%m%d_%H%M%S).sql"
docker exec directus-postgres pg_dump -U directus directus > $BACKUP_FILE
echo "Backup created: $BACKUP_FILE"
EOF
chmod +x backup-directus.sh
print_success "Backup script created: ./backup-directus.sh"

echo ""
print_success "🚀 Directus is ready! Open http://$VPS_IP:$PORT in your browser"
