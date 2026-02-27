#!/bin/bash

# Fix relations schema issues
# This script fixes UUID vs integer conflicts and removes problematic fields

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Fixing relations schema issues..."

# 1. Remove problematic relation fields from articles collection
echo "Removing problematic relation fields from articles..."
curl -X DELETE "$DIRECTUS_URL/fields/articles/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/fields/articles/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

# 2. Delete and recreate junction tables with proper UUID fields
echo "Deleting existing junction tables..."
curl -X DELETE "$DIRECTUS_URL/collections/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/collections/articles_story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

# 3. Add missing required field to story_clusters
echo "Adding cluster_title field to story_clusters..."
curl -X POST "$DIRECTUS_URL/fields/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "cluster_title",
    "type": "string",
    "meta": {
      "field": "cluster_title",
      "special": null,
      "interface": "input",
      "options": {
        "placeholder": "Cluster title"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 2,
      "width": "full",
      "translations": null,
      "note": "Title of the story cluster",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "cluster_title",
      "table": "story_clusters",
      "data_type": "varchar",
      "default_value": null,
      "max_length": 255,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

# 4. Recreate articles_tags junction table with UUID fields
echo "Creating articles_tags junction table with UUID fields..."
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "articles_tags",
    "meta": {
      "collection": "articles_tags",
      "icon": "link",
      "note": "Junction table for articles and tags many-to-many relationship",
      "display_template": null,
      "hidden": true,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": null,
      "accountability": "all",
      "color": null,
      "item_duplication_fields": null,
      "sort": null,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "articles_tags"
    }
  }'

# Add UUID fields to articles_tags
curl -X POST "$DIRECTUS_URL/fields/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "articles_id",
    "type": "uuid",
    "meta": {
      "field": "articles_id",
      "special": null,
      "interface": "select-dropdown-m2o",
      "options": {
        "template": "{{title}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 1,
      "width": "half",
      "translations": null,
      "note": "Reference to articles",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "articles_id",
      "table": "articles_tags",
      "data_type": "uuid",
      "default_value": null,
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": "id",
      "foreign_key_table": "articles"
    }
  }'

curl -X POST "$DIRECTUS_URL/fields/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "tags_id",
    "type": "uuid",
    "meta": {
      "field": "tags_id",
      "special": null,
      "interface": "select-dropdown-m2o",
      "options": {
        "template": "{{name}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{name}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 2,
      "width": "half",
      "translations": null,
      "note": "Reference to tags",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "tags_id",
      "table": "articles_tags",
      "data_type": "uuid",
      "default_value": null,
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": "id",
      "foreign_key_table": "tags"
    }
  }'

# 5. Recreate articles_story_clusters junction table with UUID fields
echo "Creating articles_story_clusters junction table with UUID fields..."
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "articles_story_clusters",
    "meta": {
      "collection": "articles_story_clusters",
      "icon": "link",
      "note": "Junction table for articles and story_clusters many-to-many relationship",
      "display_template": null,
      "hidden": true,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": null,
      "accountability": "all",
      "color": null,
      "item_duplication_fields": null,
      "sort": null,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "articles_story_clusters"
    }
  }'

# Add UUID fields to articles_story_clusters
curl -X POST "$DIRECTUS_URL/fields/articles_story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "articles_id",
    "type": "uuid",
    "meta": {
      "field": "articles_id",
      "special": null,
      "interface": "select-dropdown-m2o",
      "options": {
        "template": "{{title}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 1,
      "width": "half",
      "translations": null,
      "note": "Reference to articles",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "articles_id",
      "table": "articles_story_clusters",
      "data_type": "uuid",
      "default_value": null,
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": "id",
      "foreign_key_table": "articles"
    }
  }'

curl -X POST "$DIRECTUS_URL/fields/articles_story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "story_clusters_id",
    "type": "uuid",
    "meta": {
      "field": "story_clusters_id",
      "special": null,
      "interface": "select-dropdown-m2o",
      "options": {
        "template": "{{title}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 2,
      "width": "half",
      "translations": null,
      "note": "Reference to story_clusters",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "story_clusters_id",
      "table": "articles_story_clusters",
      "data_type": "uuid",
      "default_value": null,
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": "id",
      "foreign_key_table": "story_clusters"
    }
  }'

# 6. Fix article_series relation (change to UUID)
echo "Fixing article_series relation..."
curl -X DELETE "$DIRECTUS_URL/fields/articles/article_series_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "article_series_id",
    "type": "uuid",
    "meta": {
      "field": "article_series_id",
      "special": null,
      "interface": "select-dropdown-m2o",
      "options": {
        "template": "{{title}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 21,
      "width": "half",
      "translations": null,
      "note": "Article series this article belongs to",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "article_series_id",
      "table": "articles",
      "data_type": "uuid",
      "default_value": null,
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": true,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": "id",
      "foreign_key_table": "article_series"
    }
  }'

echo "Schema fixes completed!"
echo "Fixed:"
echo "- Removed problematic relation fields from articles"
echo "- Recreated junction tables with UUID fields"
echo "- Added missing cluster_title field to story_clusters"
echo "- Fixed article_series relation to use UUID"
