#!/bin/bash

# Directus Complete Restoration Script
# This script restores all Directus data after VPS reinstall
# Run this AFTER setting up new Directus Docker instance

set -e  # Exit on any error

# Configuration
VPS_IP="168.231.111.192"
DIRECTUS_PORT="8055"
DIRECTUS_URL="http://${VPS_IP}:${DIRECTUS_PORT}"

# Docker container names (adjust if different)
DIRECTUS_CONTAINER="directus"
POSTGRES_CONTAINER="directus-db"
POSTGRES_DB="directus"
POSTGRES_USER="directus"

# Find the most recent backup directory
BACKUP_DIR=$(ls -td directus-backup-* 2>/dev/null | head -1)

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ No backup directory found!"
    echo "Please ensure backup directory exists (directus-backup-YYYYMMDD-HHMMSS)"
    exit 1
fi

echo "🔄 Starting Directus restoration from: $BACKUP_DIR"

cd "$BACKUP_DIR"

echo "⏳ Step 1: Waiting for Directus to be ready..."
# Wait for Directus to be accessible
for i in {1..30}; do
    if curl -s "$DIRECTUS_URL/server/health" > /dev/null 2>&1; then
        echo "✅ Directus is ready!"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 10
done

echo "🗄️  Step 2: Restoring PostgreSQL database..."
# Stop Directus temporarily to restore database safely
ssh root@$VPS_IP "docker stop $DIRECTUS_CONTAINER" || echo "⚠️  Could not stop Directus container"

# Restore database
if [ -f "directus-database.sql" ]; then
    ssh root@$VPS_IP "docker exec -i $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB" < "directus-database.sql"
    echo "✅ Database restored"
else
    echo "⚠️  Database backup file not found"
fi

# Start Directus again
ssh root@$VPS_IP "docker start $DIRECTUS_CONTAINER"

# Wait for Directus to start
echo "⏳ Waiting for Directus to restart..."
sleep 30

echo "📁 Step 3: Restoring uploads and files..."
# Restore uploads
if [ -f "directus-uploads.tar.gz" ]; then
    ssh root@$VPS_IP "docker exec -i $DIRECTUS_CONTAINER tar -xzf - -C /" < "directus-uploads.tar.gz"
    echo "✅ Uploads restored"
else
    echo "⚠️  Uploads backup file not found"
fi

# Restore extensions
if [ -f "directus-extensions.tar.gz" ]; then
    ssh root@$VPS_IP "docker exec -i $DIRECTUS_CONTAINER tar -xzf - -C /" < "directus-extensions.tar.gz"
    echo "✅ Extensions restored"
else
    echo "⚠️  Extensions backup file not found"
fi

echo "⚙️  Step 4: Applying schema..."
# Get admin token (you'll need to update this with your new token)
echo "⚠️  IMPORTANT: You need to get a new admin token from the restored Directus instance"
echo "   1. Login to Directus admin panel at $DIRECTUS_URL"
echo "   2. Go to User Directory > Admin User > Generate Token"
echo "   3. Update the token below and run this section manually:"
echo ""
echo "   DIRECTUS_TOKEN=\"your_new_token_here\""
echo "   curl -X POST -H \"Authorization: Bearer \$DIRECTUS_TOKEN\" \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d @directus-schema.json \\"
echo "        \"$DIRECTUS_URL/schema/diff\""
echo ""

echo "📊 Step 5: Restoration verification..."
# Create verification script
cat > "../verify-restoration.sh" << 'EOF'
#!/bin/bash
DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="your_token_here"  # Update this!

echo "🔍 Verifying Directus restoration..."

# Check server health
echo "1. Server health:"
curl -s "$DIRECTUS_URL/server/health" | jq '.' || echo "❌ Health check failed"

# Check collections
echo "2. Collections:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/collections" | \
     jq -r '.data[].collection' || echo "❌ Collections check failed"

# Check users
echo "3. Users count:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/users" | \
     jq '.data | length' || echo "❌ Users check failed"

echo "✅ Verification complete!"
EOF

chmod +x "../verify-restoration.sh"

echo ""
echo "✅ Directus restoration completed!"
echo ""
echo "🔄 Next steps:"
echo "1. Login to Directus admin: $DIRECTUS_URL"
echo "2. Generate new admin token"
echo "3. Update server/.env with new token"
echo "4. Run verification: ./verify-restoration.sh"
echo "5. Test your Asha News backend integration"
echo ""
echo "📋 Files restored:"
echo "- Database: $([ -f "directus-database.sql" ] && echo "✅" || echo "❌")"
echo "- Uploads: $([ -f "directus-uploads.tar.gz" ] && echo "✅" || echo "❌")"
echo "- Extensions: $([ -f "directus-extensions.tar.gz" ] && echo "✅" || echo "❌")"
echo "- Schema: $([ -f "directus-schema.json" ] && echo "✅" || echo "❌")"
