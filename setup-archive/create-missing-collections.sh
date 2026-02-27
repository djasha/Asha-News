#!/bin/bash

# Create Missing Collections for Asha News Directus CMS
# Based on MISSING_COLLECTIONS_AUDIT.md

DIRECTUS_URL="http://168.231.111.192:8055"
TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🚀 Creating Missing Collections for Asha News CMS..."

# Core Content Collections
echo "📝 Creating Core Content Collections..."

# 1. Tags Collection
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "tags",
    "meta": {
      "collection": "tags",
      "icon": "local_offer",
      "note": "Article tagging system",
      "display_template": "{{name}}",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "sort",
      "accountability": "all",
      "color": "#2196F3",
      "item_duplication_fields": null,
      "sort": 1,
      "group": null,
      "collapse": "open"
    },
    "schema": {"name": "tags"}
  }' "$DIRECTUS_URL/collections"

# Add fields to tags
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "special": ["uuid"],
      "interface": "input",
      "options": null,
      "display": null,
      "display_options": null,
      "readonly": true,
      "hidden": true,
      "sort": 1,
      "width": "full",
      "translations": null,
      "note": null,
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "id",
      "table": "tags",
      "data_type": "uuid",
      "default_value": null,
      "generation_expression": null,
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_generated": false,
      "is_nullable": false,
      "is_unique": true,
      "is_indexed": false,
      "is_primary_key": true,
      "has_auto_increment": false,
      "foreign_key_schema": null,
      "foreign_key_table": null,
      "foreign_key_column": null,
      "comment": null
    }
  }' "$DIRECTUS_URL/fields/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "name",
    "type": "string",
    "meta": {
      "field": "name",
      "special": null,
      "interface": "input",
      "options": null,
      "display": null,
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 2,
      "width": "full",
      "translations": null,
      "note": "Tag name",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "name",
      "table": "tags",
      "data_type": "varchar",
      "default_value": null,
      "generation_expression": null,
      "max_length": 255,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_generated": false,
      "is_nullable": false,
      "is_unique": true,
      "is_indexed": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_schema": null,
      "foreign_key_table": null,
      "foreign_key_column": null,
      "comment": null
    }
  }' "$DIRECTUS_URL/fields/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "slug",
    "type": "string",
    "meta": {
      "field": "slug",
      "special": null,
      "interface": "input",
      "options": null,
      "display": null,
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 3,
      "width": "full",
      "translations": null,
      "note": "URL-friendly slug",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "slug",
      "table": "tags",
      "data_type": "varchar",
      "default_value": null,
      "generation_expression": null,
      "max_length": 255,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_generated": false,
      "is_nullable": true,
      "is_unique": true,
      "is_indexed": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_schema": null,
      "foreign_key_table": null,
      "foreign_key_column": null,
      "comment": null
    }
  }' "$DIRECTUS_URL/fields/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "color",
    "type": "string",
    "meta": {
      "field": "color",
      "special": null,
      "interface": "select-color",
      "options": null,
      "display": "color",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 4,
      "width": "half",
      "translations": null,
      "note": "Tag color",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "color",
      "table": "tags",
      "data_type": "varchar",
      "default_value": "#2196F3",
      "generation_expression": null,
      "max_length": 7,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_generated": false,
      "is_nullable": true,
      "is_unique": false,
      "is_indexed": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_schema": null,
      "foreign_key_table": null,
      "foreign_key_column": null,
      "comment": null
    }
  }' "$DIRECTUS_URL/fields/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "description",
    "type": "text",
    "meta": {
      "field": "description",
      "special": null,
      "interface": "input-multiline",
      "options": null,
      "display": null,
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 5,
      "width": "full",
      "translations": null,
      "note": "Tag description",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "description",
      "table": "tags",
      "data_type": "text",
      "default_value": null,
      "generation_expression": null,
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_generated": false,
      "is_nullable": true,
      "is_unique": false,
      "is_indexed": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_schema": null,
      "foreign_key_table": null,
      "foreign_key_column": null,
      "comment": null
    }
  }' "$DIRECTUS_URL/fields/tags"

echo "✅ Tags collection created"

# 2. Article Series Collection
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "article_series",
    "meta": {
      "collection": "article_series",
      "icon": "view_list",
      "note": "Multi-part article series",
      "display_template": "{{title}}",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "sort",
      "accountability": "all",
      "color": "#4CAF50",
      "item_duplication_fields": null,
      "sort": 2,
      "group": null,
      "collapse": "open"
    },
    "schema": {"name": "article_series"}
  }' "$DIRECTUS_URL/collections"

# Add fields to article_series
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "special": ["uuid"],
      "interface": "input",
      "options": null,
      "display": null,
      "display_options": null,
      "readonly": true,
      "hidden": true,
      "sort": 1,
      "width": "full",
      "translations": null,
      "note": null,
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "id",
      "table": "article_series",
      "data_type": "uuid",
      "default_value": null,
      "generation_expression": null,
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_generated": false,
      "is_nullable": false,
      "is_unique": true,
      "is_indexed": false,
      "is_primary_key": true,
      "has_auto_increment": false,
      "foreign_key_schema": null,
      "foreign_key_table": null,
      "foreign_key_column": null,
      "comment": null
    }
  }' "$DIRECTUS_URL/fields/article_series"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "title",
    "type": "string",
    "meta": {
      "field": "title",
      "special": null,
      "interface": "input",
      "options": null,
      "display": null,
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 2,
      "width": "full",
      "translations": null,
      "note": "Series title",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "title",
      "table": "article_series",
      "data_type": "varchar",
      "default_value": null,
      "generation_expression": null,
      "max_length": 255,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_generated": false,
      "is_nullable": false,
      "is_unique": false,
      "is_indexed": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_schema": null,
      "foreign_key_table": null,
      "foreign_key_column": null,
      "comment": null
    }
  }' "$DIRECTUS_URL/fields/article_series"

echo "✅ Article Series collection created"

# User Management Collections
echo "👥 Creating User Management Collections..."

# 3. User Activity Collection
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "user_activity",
    "meta": {
      "collection": "user_activity",
      "icon": "timeline",
      "note": "User behavior tracking",
      "display_template": "{{action}} - {{user}}",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "timestamp",
      "accountability": "all",
      "color": "#FF9800",
      "item_duplication_fields": null,
      "sort": 3,
      "group": null,
      "collapse": "open"
    },
    "schema": {"name": "user_activity"}
  }' "$DIRECTUS_URL/collections"

echo "✅ User Activity collection created"

# Advanced Features Collections
echo "🤖 Creating Advanced Features Collections..."

# 4. AI Analysis Logs Collection
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "ai_analysis_logs",
    "meta": {
      "collection": "ai_analysis_logs",
      "icon": "psychology",
      "note": "AI processing logs",
      "display_template": "{{analysis_type}} - {{article_id}}",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "created_at",
      "accountability": "all",
      "color": "#9C27B0",
      "item_duplication_fields": null,
      "sort": 4,
      "group": null,
      "collapse": "open"
    },
    "schema": {"name": "ai_analysis_logs"}
  }' "$DIRECTUS_URL/collections"

echo "✅ AI Analysis Logs collection created"

# 5. Notification Queue Collection
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "notification_queue",
    "meta": {
      "collection": "notification_queue",
      "icon": "notifications",
      "note": "Notification system",
      "display_template": "{{type}} - {{recipient}}",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "created_at",
      "accountability": "all",
      "color": "#F44336",
      "item_duplication_fields": null,
      "sort": 5,
      "group": null,
      "collapse": "open"
    },
    "schema": {"name": "notification_queue"}
  }' "$DIRECTUS_URL/collections"

echo "✅ Notification Queue collection created"

echo ""
echo "🎉 Missing Collections Creation Complete!"
echo "📊 Created 5 new collections:"
echo "   1. ✅ tags - Article tagging system"
echo "   2. ✅ article_series - Multi-part article series"
echo "   3. ✅ user_activity - User behavior tracking"
echo "   4. ✅ ai_analysis_logs - AI processing logs"
echo "   5. ✅ notification_queue - Notification system"
echo ""
echo "🔗 Next Steps:"
echo "   1. Add remaining fields to each collection"
echo "   2. Create relations between collections"
echo "   3. Populate sample data"
echo "   4. Test collection access in admin panel"
echo ""
echo "🌐 Access collections at: $DIRECTUS_URL/admin/content"
