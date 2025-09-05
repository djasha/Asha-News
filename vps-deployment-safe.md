# Safe VPS Deployment - Terminal Only

## Pre-Deployment Safety Checks

### 1. Check Current Services
```bash
# Check what ports are in use
sudo netstat -tlnp | grep LISTEN

# Check running Docker containers
docker ps

# Check available disk space
df -h

# Check available memory
free -h
```

### 2. Choose Safe Port
If port 8055 is taken, use an alternative:
```bash
# Test if port is available
nc -z localhost 8055 && echo "Port 8055 is taken" || echo "Port 8055 is free"

# Alternative ports to try: 8056, 8057, 9055, 9056
```

## Safe Deployment Steps

### Step 1: Create Isolated Directory
```bash
# Create dedicated directory (won't interfere with existing services)
mkdir -p ~/directus-admin
cd ~/directus-admin

# Create data directories
mkdir -p directus-data/{db,redis,uploads,extensions}
```

### Step 2: Upload Files
From your local machine:
```bash
# Upload configuration files
scp docker-compose.directus.yml user@your-vps-ip:~/directus-admin/
scp .env.directus.example user@your-vps-ip:~/directus-admin/
```

### Step 3: Configure Environment
```bash
# SSH into VPS
ssh user@your-vps-ip
cd ~/directus-admin

# Create environment file
cp .env.directus.example .env.directus

# Generate secure keys
openssl rand -hex 32  # Copy first result for DIRECTUS_SECRET_KEY
openssl rand -hex 32  # Copy second result for DIRECTUS_SECRET

# Edit environment file
nano .env.directus
```

**Required changes in .env.directus:**
```bash
DIRECTUS_PORT=8055  # Change if port conflicts
DIRECTUS_DB_PASSWORD=your_secure_db_password_123
DIRECTUS_SECRET_KEY=paste_first_generated_key_here
DIRECTUS_SECRET=paste_second_generated_key_here
DIRECTUS_ADMIN_EMAIL=admin@asha.news
DIRECTUS_ADMIN_PASSWORD=your_secure_admin_password
DIRECTUS_PUBLIC_URL=http://YOUR_VPS_IP:8055  # Replace YOUR_VPS_IP
DIRECTUS_CORS_ORIGIN=http://localhost:3000,https://asha.news,https://www.asha.news
```

### Step 4: Pre-Flight Check
```bash
# Verify configuration
docker-compose -f docker-compose.directus.yml config

# Check if images are available
docker pull directus/directus:latest
docker pull postgres:15-alpine
docker pull redis:7-alpine
```

### Step 5: Deploy (Safe Start)
```bash
# Start in foreground first (to see any errors)
docker-compose -f docker-compose.directus.yml --env-file .env.directus up

# If everything looks good, stop with Ctrl+C and start in background
docker-compose -f docker-compose.directus.yml --env-file .env.directus up -d
```

### Step 6: Verify Deployment
```bash
# Check container status
docker-compose -f docker-compose.directus.yml ps

# Check logs
docker logs directus-app
docker logs directus-postgres

# Test health endpoint (from VPS)
curl -f http://localhost:8055/server/health
```

### Step 7: Firewall (If Needed)
```bash
# Ubuntu/Debian
sudo ufw allow 8055

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8055/tcp
sudo firewall-cmd --reload
```

## Isolation Features

### Resource Limits
- **Memory**: Limited to 1GB max (won't consume all VPS memory)
- **CPU**: Limited to 0.5 cores max (won't starve other services)
- **Network**: Isolated bridge network (172.20.0.0/16)
- **Storage**: Dedicated directory (~/directus-admin/directus-data/)

### No Port Conflicts
- Database: Internal only (no external port)
- Redis: Internal only (no external port)
- Directus: Only configured port exposed (default 8055)

### Easy Cleanup
If you need to remove everything:
```bash
cd ~/directus-admin
docker-compose -f docker-compose.directus.yml down -v
rm -rf directus-data/
```

## Monitoring Commands

### Check Resource Usage
```bash
# Container resource usage
docker stats directus-app directus-postgres directus-redis

# System impact
htop  # or top
```

### View Logs
```bash
# Real-time logs
docker logs directus-app -f

# Error logs only
docker logs directus-app 2>&1 | grep -i error
```

### Health Checks
```bash
# Quick health check
curl -s http://localhost:8055/server/health | jq .

# Database connection test
docker exec directus-postgres pg_isready -U directus
```

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
sudo lsof -i :8055

# Change port in .env.directus
DIRECTUS_PORT=8056
DIRECTUS_PUBLIC_URL=http://YOUR_VPS_IP:8056
```

### Container Won't Start
```bash
# Check logs
docker logs directus-app
docker logs directus-postgres

# Check disk space
df -h

# Check permissions
ls -la directus-data/
```

### Memory Issues
```bash
# Check memory usage
free -h
docker stats

# Reduce memory limit if needed (edit docker-compose.directus.yml)
memory: 512M  # Instead of 1G
```

## Access Admin Panel

Once deployed successfully:
1. **Open browser** to: `http://YOUR_VPS_IP:8055`
2. **Login with**:
   - Email: Value from `DIRECTUS_ADMIN_EMAIL`
   - Password: Value from `DIRECTUS_ADMIN_PASSWORD`

## Next Steps

After successful deployment:
1. **Change admin password** in Directus interface
2. **Create content collections** (Pages, Menus, Categories)
3. **Set up user roles** and permissions
4. **Integrate with Node.js backend**

This setup is completely isolated and won't interfere with your existing VPS services.
