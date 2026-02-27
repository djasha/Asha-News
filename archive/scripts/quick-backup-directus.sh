#!/bin/bash

# Quick Directus Backup - Essential Data Only
# Faster backup focusing on critical data before VPS reinstall

set -e

BACKUP_DIR="./directus-backup-$(date +%Y%m%d-%H%M%S)"
VPS_IP="168.231.111.192"
DIRECTUS_URL="http://${VPS_IP}:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🚀 Quick Directus backup starting..."
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# 1. Export schema (most important)
echo "📊 Exporting schema..."
curl -H "Authorization: Bearer $DIRECTUS_TOKEN" \
     "$DIRECTUS_URL/schema/snapshot" \
     -o "schema.json"

# 2. Export critical collections data
echo "📋 Exporting collections..."
mkdir -p collections

# Key collections for your news system
CRITICAL_COLLECTIONS="articles news_sources rss_sources site_configuration global_settings topic_categories breaking_news daily_briefs trending_topics homepage_sections"

for collection in $CRITICAL_COLLECTIONS; do
    echo "  📄 $collection"
    curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
         "$DIRECTUS_URL/items/$collection?limit=-1" \
         -o "collections/${collection}.json" 2>/dev/null || echo "    ⚠️  Skipped $collection"
done

# 3. Database dump (essential)
echo "🗄️  Database dump..."
ssh root@$VPS_IP "docker exec directus-db pg_dump -U directus -d directus" > "database.sql"

# 4. Create restoration commands
cat > "../restore-commands.txt" << EOF
# Directus Restoration Commands
# Run these after setting up new Directus instance:

# 1. Restore database
ssh root@$VPS_IP "docker exec -i directus-db psql -U directus -d directus" < $BACKUP_DIR/database.sql

# 2. Apply schema (get new token first!)
curl -X POST -H "Authorization: Bearer NEW_TOKEN_HERE" \\
     -H "Content-Type: application/json" \\
     -d @$BACKUP_DIR/schema.json \\
     "$DIRECTUS_URL/schema/diff"

# 3. Update your server/.env with new token
# 4. Restart your backend server
EOF

echo ""
echo "✅ Quick backup complete: $BACKUP_DIR"
echo "📋 Essential files backed up:"
echo "   - Schema definition"
echo "   - Database dump"  
echo "   - $(ls collections/ | wc -l) collections"
echo ""
echo "📝 Restoration commands saved to: restore-commands.txt"
