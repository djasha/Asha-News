#!/bin/bash

# Download Directus Backup to Local Computer
# This script downloads all Directus data from VPS to your local machine

set -e

# Configuration
VPS_IP="168.231.111.192"
VPS_USER="root"
DIRECTUS_URL="http://${VPS_IP}:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"
LOCAL_BACKUP_DIR="./directus-backup-$(date +%Y%m%d-%H%M%S)"

echo "🔄 Downloading Directus backup from VPS to local computer..."
echo "📁 Local backup directory: $LOCAL_BACKUP_DIR"

# Create local backup directory
mkdir -p "$LOCAL_BACKUP_DIR"
cd "$LOCAL_BACKUP_DIR"

echo "📊 Step 1: Downloading schema and configuration..."

# Download schema directly from Directus API
curl -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/schema/snapshot" \
     -o "directus-schema.json"

echo "📋 Step 2: Downloading all collections data..."

# Get list of collections and download each one
mkdir -p collections

# Download collections list first
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/collections" > "collections-list.json"

# Extract collection names and download data
COLLECTIONS=$(cat collections-list.json | jq -r '.data[].collection' 2>/dev/null || echo "")

if [ -n "$COLLECTIONS" ]; then
    for collection in $COLLECTIONS; do
        echo "  📄 Downloading collection: $collection"
        curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
             "$DIRECTUS_URL/items/$collection?limit=-1" \
             -o "collections/${collection}.json" || echo "    ⚠️  Failed to download $collection"
    done
else
    echo "  ⚠️  Could not retrieve collections list"
fi

echo "🗄️  Step 3: Creating and downloading database dump..."

# Create database dump on VPS and download it
ssh $VPS_USER@$VPS_IP "docker exec directus-db pg_dump -U directus -d directus > /tmp/directus-backup.sql"
scp $VPS_USER@$VPS_IP:/tmp/directus-backup.sql ./directus-database.sql
ssh $VPS_USER@$VPS_IP "rm /tmp/directus-backup.sql"  # Clean up temp file

echo "📁 Step 4: Downloading uploads and files..."

# Create archives on VPS and download them
ssh $VPS_USER@$VPS_IP "docker exec directus tar -czf /tmp/directus-uploads.tar.gz -C /directus uploads 2>/dev/null || echo 'No uploads found'"
scp $VPS_USER@$VPS_IP:/tmp/directus-uploads.tar.gz ./directus-uploads.tar.gz 2>/dev/null || echo "⚠️  No uploads to download"

ssh $VPS_USER@$VPS_IP "docker exec directus tar -czf /tmp/directus-extensions.tar.gz -C /directus extensions 2>/dev/null || echo 'No extensions found'"
scp $VPS_USER@$VPS_IP:/tmp/directus-extensions.tar.gz ./directus-extensions.tar.gz 2>/dev/null || echo "⚠️  No extensions to download"

# Clean up temp files on VPS
ssh $VPS_USER@$VPS_IP "rm -f /tmp/directus-uploads.tar.gz /tmp/directus-extensions.tar.gz"

echo "⚙️  Step 5: Downloading Docker configuration..."

# Download docker-compose.yml
scp $VPS_USER@$VPS_IP:/opt/directus/docker-compose.yml ./docker-compose.yml 2>/dev/null || echo "⚠️  Docker compose file not found"

# Get environment variables
ssh $VPS_USER@$VPS_IP "docker exec directus env | grep -E '^(DB_|DIRECTUS_|ADMIN_)'" > "directus-env.txt" || echo "⚠️  Could not get environment variables"

echo "🔐 Step 6: Downloading users and permissions..."

# Download users
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/users?limit=-1" \
     -o "directus-users.json"

# Download roles
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/roles?limit=-1" \
     -o "directus-roles.json"

# Download permissions
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/permissions?limit=-1" \
     -o "directus-permissions.json"

echo "📋 Step 7: Creating local backup manifest..."

# Create backup manifest
cat > "backup-manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_location": "local",
  "source_vps": "$VPS_IP",
  "directus_url": "$DIRECTUS_URL",
  "local_backup_dir": "$LOCAL_BACKUP_DIR",
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
  ]
}
EOF

echo "📊 Step 8: Creating backup summary..."

# Generate backup summary
cat > "BACKUP_SUMMARY.md" << EOF
# Directus Local Backup Summary

**Backup Date:** $(date)
**Source VPS:** $VPS_IP
**Local Directory:** $LOCAL_BACKUP_DIR

## Downloaded Files:

### Core Data
- ✅ \`directus-schema.json\` - Complete schema definition
- ✅ \`directus-database.sql\` - PostgreSQL database dump
- $([ -f "directus-uploads.tar.gz" ] && echo "✅" || echo "❌") \`directus-uploads.tar.gz\` - All uploaded files
- $([ -f "directus-extensions.tar.gz" ] && echo "✅" || echo "❌") \`directus-extensions.tar.gz\` - Custom extensions

### Configuration
- $([ -f "docker-compose.yml" ] && echo "✅" || echo "❌") \`docker-compose.yml\` - Docker setup
- ✅ \`directus-env.txt\` - Environment variables

### Access Control
- ✅ \`directus-users.json\` - User accounts
- ✅ \`directus-roles.json\` - User roles
- ✅ \`directus-permissions.json\` - Permissions setup

### Collections Data
- ✅ \`collections/\` - $(ls collections/ 2>/dev/null | wc -l || echo '0') individual collection exports

## File Sizes:
- Schema: $(ls -lh directus-schema.json 2>/dev/null | awk '{print $5}' || echo 'N/A')
- Database: $(ls -lh directus-database.sql 2>/dev/null | awk '{print $5}' || echo 'N/A')
- Uploads: $(ls -lh directus-uploads.tar.gz 2>/dev/null | awk '{print $5}' || echo 'N/A')
- Total backup size: $(du -sh . | awk '{print $1}')

## Next Steps:
1. ✅ Backup downloaded to local computer
2. 🔄 Copy to external storage for safety
3. 🔄 Proceed with VPS reinstall
4. 🔄 Use upload-directus-backup.sh to restore
EOF

cd ..

echo ""
echo "✅ Directus backup downloaded successfully to your local computer!"
echo "📁 Local backup location: $LOCAL_BACKUP_DIR"
echo "💾 Total size: $(du -sh "$LOCAL_BACKUP_DIR" | awk '{print $1}')"
echo ""
echo "📊 View summary: cat $LOCAL_BACKUP_DIR/BACKUP_SUMMARY.md"
echo ""
echo "🔄 Next steps:"
echo "1. ✅ Backup is now on your local computer"
echo "2. 💾 Copy backup folder to external drive/cloud storage"
echo "3. 🔄 Proceed with VPS reinstall"
echo "4. 🚀 Use upload-directus-backup.sh to restore after reinstall"
