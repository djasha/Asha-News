#!/bin/bash

# Directus Complete Backup Script
# This script backs up all Directus data, schema, uploads, and configuration
# Run this BEFORE reinstalling your VPS Docker setup

set -e  # Exit on any error

# Configuration
BACKUP_DIR="./directus-backup-$(date +%Y%m%d-%H%M%S)"
VPS_IP="168.231.111.192"
DIRECTUS_PORT="8055"
DIRECTUS_URL="http://${VPS_IP}:${DIRECTUS_PORT}"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

# Docker container names (adjust if different)
DIRECTUS_CONTAINER="directus"
POSTGRES_CONTAINER="directus-db"
POSTGRES_DB="directus"
POSTGRES_USER="directus"

echo "🔄 Starting Directus complete backup..."
echo "📁 Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

echo "📊 Step 1: Exporting Directus schema and configuration..."

# Export schema (collections, fields, relations, permissions)
curl -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/schema/snapshot" \
     -o "directus-schema.json" || echo "⚠️  Schema export failed"

# Export all collections data
echo "📋 Step 2: Exporting all collections data..."

# Get list of all collections
COLLECTIONS=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
              "$DIRECTUS_URL/collections" | \
              jq -r '.data[].collection' 2>/dev/null || echo "")

if [ -n "$COLLECTIONS" ]; then
    mkdir -p collections
    for collection in $COLLECTIONS; do
        echo "  📄 Exporting collection: $collection"
        curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
             "$DIRECTUS_URL/items/$collection?limit=-1" \
             -o "collections/${collection}.json" || echo "    ⚠️  Failed to export $collection"
    done
else
    echo "  ⚠️  Could not retrieve collections list"
fi

echo "🗄️  Step 3: Creating PostgreSQL database dump..."

# Create PostgreSQL dump
ssh root@$VPS_IP "docker exec $POSTGRES_CONTAINER pg_dump -U $POSTGRES_USER -d $POSTGRES_DB" > "directus-database.sql" || echo "⚠️  Database dump failed"

echo "📁 Step 4: Backing up Directus uploads and files..."

# Backup uploads directory
ssh root@$VPS_IP "docker exec $DIRECTUS_CONTAINER tar -czf - /directus/uploads" > "directus-uploads.tar.gz" || echo "⚠️  Uploads backup failed"

# Backup extensions (if any)
ssh root@$VPS_IP "docker exec $DIRECTUS_CONTAINER tar -czf - /directus/extensions" > "directus-extensions.tar.gz" || echo "⚠️  Extensions backup failed"

echo "⚙️  Step 5: Backing up Docker configuration..."

# Backup docker-compose.yml
ssh root@$VPS_IP "cat /opt/directus/docker-compose.yml" > "docker-compose.yml" || echo "⚠️  Docker compose backup failed"

# Backup environment variables
ssh root@$VPS_IP "docker exec $DIRECTUS_CONTAINER env | grep -E '^(DB_|DIRECTUS_|ADMIN_)'" > "directus-env.txt" || echo "⚠️  Environment backup failed"

echo "🔐 Step 6: Exporting users and permissions..."

# Export users
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/users?limit=-1" \
     -o "directus-users.json" || echo "⚠️  Users export failed"

# Export roles
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/roles?limit=-1" \
     -o "directus-roles.json" || echo "⚠️  Roles export failed"

# Export permissions
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/permissions?limit=-1" \
     -o "directus-permissions.json" || echo "⚠️  Permissions export failed"

echo "📋 Step 7: Creating backup manifest..."

# Create backup manifest
cat > "backup-manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "directus_version": "$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/server/info" | jq -r '.data.directus.version' 2>/dev/null || echo 'unknown')",
  "vps_ip": "$VPS_IP",
  "directus_url": "$DIRECTUS_URL",
  "files": [
    "directus-schema.json",
    "directus-database.sql",
    "directus-uploads.tar.gz",
    "directus-extensions.tar.gz",
    "docker-compose.yml",
    "directus-env.txt",
    "directus-users.json",
    "directus-roles.json",
    "directus-permissions.json",
    "collections/"
  ],
  "notes": "Complete Directus backup before VPS reinstall"
}
EOF

echo "📊 Step 8: Generating backup summary..."

# Generate backup summary
cat > "BACKUP_SUMMARY.md" << EOF
# Directus Backup Summary

**Backup Date:** $(date)
**Backup Directory:** $BACKUP_DIR

## Files Included:

### Core Data
- \`directus-schema.json\` - Complete schema definition
- \`directus-database.sql\` - PostgreSQL database dump
- \`directus-uploads.tar.gz\` - All uploaded files
- \`directus-extensions.tar.gz\` - Custom extensions

### Configuration
- \`docker-compose.yml\` - Docker setup
- \`directus-env.txt\` - Environment variables

### Access Control
- \`directus-users.json\` - User accounts
- \`directus-roles.json\` - User roles
- \`directus-permissions.json\` - Permissions setup

### Collections Data
- \`collections/\` - Individual collection exports

## Restoration Instructions:

1. Set up new Directus Docker instance
2. Run the restoration script: \`./restore-directus.sh\`
3. Update environment variables if needed
4. Verify all data and permissions

## Backup Statistics:
EOF

# Add file sizes to summary
echo "- Schema file: $(ls -lh directus-schema.json 2>/dev/null | awk '{print $5}' || echo 'N/A')" >> "BACKUP_SUMMARY.md"
echo "- Database dump: $(ls -lh directus-database.sql 2>/dev/null | awk '{print $5}' || echo 'N/A')" >> "BACKUP_SUMMARY.md"
echo "- Uploads archive: $(ls -lh directus-uploads.tar.gz 2>/dev/null | awk '{print $5}' || echo 'N/A')" >> "BACKUP_SUMMARY.md"
echo "- Collections count: $(ls collections/ 2>/dev/null | wc -l || echo '0')" >> "BACKUP_SUMMARY.md"

cd ..

echo ""
echo "✅ Directus backup completed successfully!"
echo "📁 Backup location: $BACKUP_DIR"
echo "📊 View summary: cat $BACKUP_DIR/BACKUP_SUMMARY.md"
echo ""
echo "🔄 Next steps:"
echo "1. Verify backup files are complete"
echo "2. Copy backup to safe location (external storage)"
echo "3. Proceed with VPS reinstall"
echo "4. Use restore-directus.sh to recover data"
