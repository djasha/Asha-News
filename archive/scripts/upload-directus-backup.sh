#!/bin/bash

# Upload and Restore Directus Backup to VPS
# This script uploads your local backup to VPS and restores it

set -e

# Configuration
VPS_IP="168.231.111.192"
VPS_USER="root"
DIRECTUS_URL="http://${VPS_IP}:8055"

# Find the most recent local backup directory
BACKUP_DIR=$(ls -td directus-backup-* 2>/dev/null | head -1)

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ No local backup directory found!"
    echo "Please ensure backup directory exists (directus-backup-YYYYMMDD-HHMMSS)"
    exit 1
fi

echo "🚀 Uploading and restoring Directus backup: $BACKUP_DIR"

# Create temporary directory on VPS
ssh $VPS_USER@$VPS_IP "mkdir -p /tmp/directus-restore"

echo "📤 Step 1: Uploading backup files to VPS..."

# Upload all backup files
scp -r "$BACKUP_DIR"/* $VPS_USER@$VPS_IP:/tmp/directus-restore/

echo "🗄️  Step 2: Restoring database..."

# Stop Directus to safely restore database
ssh $VPS_USER@$VPS_IP "docker stop directus 2>/dev/null || echo 'Directus not running'"

# Restore database
ssh $VPS_USER@$VPS_IP "docker exec -i directus-db psql -U directus -d directus < /tmp/directus-restore/directus-database.sql"

# Start Directus
ssh $VPS_USER@$VPS_IP "docker start directus"

echo "⏳ Waiting for Directus to start..."
sleep 30

echo "📁 Step 3: Restoring files and uploads..."

# Restore uploads if they exist
ssh $VPS_USER@$VPS_IP "
if [ -f /tmp/directus-restore/directus-uploads.tar.gz ]; then
    docker exec directus tar -xzf - -C / < /tmp/directus-restore/directus-uploads.tar.gz
    echo '✅ Uploads restored'
else
    echo '⚠️  No uploads to restore'
fi
"

# Restore extensions if they exist
ssh $VPS_USER@$VPS_IP "
if [ -f /tmp/directus-restore/directus-extensions.tar.gz ]; then
    docker exec directus tar -xzf - -C / < /tmp/directus-restore/directus-extensions.tar.gz
    echo '✅ Extensions restored'
else
    echo '⚠️  No extensions to restore'
fi
"

echo "⚙️  Step 4: Applying schema..."

# Wait for Directus to be fully ready
echo "⏳ Waiting for Directus API to be ready..."
for i in {1..30}; do
    if ssh $VPS_USER@$VPS_IP "curl -s $DIRECTUS_URL/server/health" > /dev/null 2>&1; then
        echo "✅ Directus API is ready!"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 10
done

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "1. Login to Directus admin: $DIRECTUS_URL"
echo "2. Use default credentials or check your backup files"
echo "3. Generate a new admin token"
echo "4. Run this command with your new token:"
echo ""
echo "   NEW_TOKEN=\"your_new_token_here\""
echo "   ssh $VPS_USER@$VPS_IP \"curl -X POST -H 'Authorization: Bearer \$NEW_TOKEN' -H 'Content-Type: application/json' -d @/tmp/directus-restore/directus-schema.json '$DIRECTUS_URL/schema/diff'\""
echo ""

echo "🧹 Step 5: Cleaning up temporary files..."
ssh $VPS_USER@$VPS_IP "rm -rf /tmp/directus-restore"

echo ""
echo "✅ Directus backup uploaded and mostly restored!"
echo ""
echo "🔄 Final steps:"
echo "1. 🌐 Visit: $DIRECTUS_URL"
echo "2. 🔑 Login and generate new admin token"
echo "3. 📊 Apply schema using command above"
echo "4. 🔧 Update your server/.env with new token:"
echo "   DIRECTUS_TOKEN=\"your_new_token\""
echo "5. 🔄 Restart your Asha News backend server"
echo ""
echo "📋 Restoration status:"
echo "- Database: ✅ Restored"
echo "- Files: ✅ Restored"
echo "- Schema: ⏳ Manual step required"
echo "- Token: ⏳ Manual step required"
