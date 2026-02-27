#!/bin/bash

# VPS Directus Backup Script (Final - Correct DB Credentials)
# Run this script ON THE VPS to backup all Directus data locally on VPS

set -e

# Configuration
DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"
BACKUP_DIR="/tmp/directus-backup-$(date +%Y%m%d-%H%M%S)"

# Correct container names and DB credentials
DIRECTUS_CONTAINER="directus-app"
POSTGRES_CONTAINER="directus-postgres"
POSTGRES_DB="directus"
POSTGRES_USER="directus"

echo "🔄 Creating Directus backup on VPS..."
echo "📁 VPS backup directory: $BACKUP_DIR"

# Create backup directory on VPS
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

echo "📊 Step 1: Exporting schema..."
curl -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/schema/snapshot" \
     -o "directus-schema.json"

echo "📋 Step 2: Exporting collections..."
mkdir -p collections

# Get collections list
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/collections" > "collections-list.json"

# Extract and download each collection
COLLECTIONS=$(cat collections-list.json | jq -r '.data[].collection' 2>/dev/null || echo "")

if [ -n "$COLLECTIONS" ]; then
    for collection in $COLLECTIONS; do
        echo "  📄 Exporting: $collection"
        curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
             "$DIRECTUS_URL/items/$collection?limit=-1" \
             -o "collections/${collection}.json" || echo "    ⚠️  Failed: $collection"
    done
fi

echo "🗄️  Step 3: Creating database dump..."
docker exec $POSTGRES_CONTAINER pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > "directus-database.sql"

echo "📁 Step 4: Backing up files..."
# Backup uploads
docker exec $DIRECTUS_CONTAINER tar -czf - -C /directus uploads 2>/dev/null > "directus-uploads.tar.gz" || echo "⚠️  No uploads found"

# Backup extensions  
docker exec $DIRECTUS_CONTAINER tar -czf - -C /directus extensions 2>/dev/null > "directus-extensions.tar.gz" || echo "⚠️  No extensions found"

echo "⚙️  Step 5: Saving configuration..."
# Find and save docker-compose.yml
for location in "/opt/directus" "/root" "$(pwd)"; do
    if [ -f "$location/docker-compose.yml" ]; then
        cp "$location/docker-compose.yml" .
        echo "✅ Docker compose saved from $location"
        break
    fi
done

# Save environment variables
docker exec $DIRECTUS_CONTAINER env | grep -E '^(DB_|DIRECTUS_|ADMIN_)' > "directus-env.txt"

echo "🔐 Step 6: Exporting users and permissions..."
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/users?limit=-1" \
     -o "directus-users.json"

curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/roles?limit=-1" \
     -o "directus-roles.json"

curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/permissions?limit=-1" \
     -o "directus-permissions.json"

echo "📋 Step 7: Creating backup summary..."
cat > "BACKUP_INFO.txt" << EOF
Directus VPS Backup - FINAL
===========================
Backup Date: $(date)
Backup Location: $BACKUP_DIR
VPS IP: $(hostname -I | awk '{print $1}')
Directus URL: $DIRECTUS_URL

Container Configuration:
- Directus: $DIRECTUS_CONTAINER
- PostgreSQL: $POSTGRES_CONTAINER
- Database: $POSTGRES_DB
- DB User: $POSTGRES_USER

Files Included:
- directus-schema.json ($(ls -lh directus-schema.json | awk '{print $5}'))
- directus-database.sql ($(ls -lh directus-database.sql | awk '{print $5}'))
- directus-uploads.tar.gz ($(ls -lh directus-uploads.tar.gz 2>/dev/null | awk '{print $5}' || echo 'N/A'))
- directus-extensions.tar.gz ($(ls -lh directus-extensions.tar.gz 2>/dev/null | awk '{print $5}' || echo 'N/A'))
- Collections: $(ls collections/ | wc -l) files
- Users, roles, permissions: ✅

Total Backup Size: $(du -sh . | awk '{print $1}')

Download Command (run from your local computer):
scp -r root@$(hostname -I | awk '{print $1}'):$BACKUP_DIR ./
EOF

echo ""
echo "✅ VPS backup completed successfully!"
echo "📁 Backup location on VPS: $BACKUP_DIR"
echo "💾 Total size: $(du -sh . | awk '{print $1}')"
echo ""
echo "📥 To download to your local computer, run this command:"
echo "   scp -r root@$(hostname -I | awk '{print $1}'):$BACKUP_DIR ./"
echo ""
echo "📊 View backup details:"
echo "   cat $BACKUP_DIR/BACKUP_INFO.txt"
