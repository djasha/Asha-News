#!/bin/bash

# VPS Directus Restoration Script
# This script uploads and restores your local backup to the VPS

set -e

# Configuration
VPS_IP="168.231.111.192"
VPS_USER="root"
DIRECTUS_URL="http://localhost:8055"
LOCAL_BACKUP_DIR="directus-backup-20250910-173244"

# Container names
DIRECTUS_CONTAINER="directus-app"
POSTGRES_CONTAINER="directus-postgres"
POSTGRES_DB="directus"
POSTGRES_USER="directus"

echo "🚀 Starting Directus restoration to VPS..."

# Check if local backup exists
if [ ! -d "$LOCAL_BACKUP_DIR" ]; then
    echo "❌ Local backup directory not found: $LOCAL_BACKUP_DIR"
    exit 1
fi

echo "📤 Step 1: Uploading backup to VPS..."
ssh $VPS_USER@$VPS_IP "mkdir -p /tmp/restore"
scp -r "$LOCAL_BACKUP_DIR"/* $VPS_USER@$VPS_IP:/tmp/restore/

echo "🛑 Step 2: Stopping Directus for safe restoration..."
ssh $VPS_USER@$VPS_IP "docker stop $DIRECTUS_CONTAINER"

echo "🗄️  Step 3: Restoring database..."
ssh $VPS_USER@$VPS_IP "docker exec -i $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'"
ssh $VPS_USER@$VPS_IP "docker exec -i $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB < /tmp/restore/directus-database.sql"

echo "🔄 Step 4: Starting Directus..."
ssh $VPS_USER@$VPS_IP "docker start $DIRECTUS_CONTAINER"

echo "⏳ Waiting for Directus to start..."
sleep 30

echo "📁 Step 5: Restoring files..."
# Restore uploads
ssh $VPS_USER@$VPS_IP "
if [ -f /tmp/restore/directus-uploads.tar.gz ]; then
    docker exec $DIRECTUS_CONTAINER tar -xzf - -C / < /tmp/restore/directus-uploads.tar.gz
    echo '✅ Uploads restored'
else
    echo '⚠️  No uploads to restore'
fi
"

# Restore extensions
ssh $VPS_USER@$VPS_IP "
if [ -f /tmp/restore/directus-extensions.tar.gz ]; then
    docker exec $DIRECTUS_CONTAINER tar -xzf - -C / < /tmp/restore/directus-extensions.tar.gz
    echo '✅ Extensions restored'
else
    echo '⚠️  No extensions to restore'
fi
"

echo "⏳ Step 6: Waiting for Directus to be fully ready..."
for i in {1..30}; do
    if ssh $VPS_USER@$VPS_IP "curl -s $DIRECTUS_URL/server/health" > /dev/null 2>&1; then
        echo "✅ Directus is ready!"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 10
done

echo "🧹 Step 7: Cleaning up temporary files..."
ssh $VPS_USER@$VPS_IP "rm -rf /tmp/restore"

echo ""
echo "✅ Directus restoration completed successfully!"
echo ""
echo "🔄 Next steps:"
echo "1. 🌐 Visit: http://$VPS_IP:8055"
echo "2. 🔑 Login with your restored admin account"
echo "3. 🎯 Generate new admin token in User Directory"
echo "4. 🔧 Update your server/.env with new token:"
echo "   DIRECTUS_TOKEN=\"your_new_token\""
echo "5. 🔄 Restart your Asha News backend server"
echo ""
echo "📊 Restoration status:"
echo "- Database: ✅ Restored"
echo "- Files: ✅ Restored"
echo "- Schema: ✅ Restored"
echo "- Ready for new token generation"
