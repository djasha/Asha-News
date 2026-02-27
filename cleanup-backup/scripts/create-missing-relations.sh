#!/bin/bash

# Create missing relations for Directus collections
# This script creates the missing many-to-many and many-to-one relations

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Creating missing relations for Directus collections..."

# 1. Create articles ↔ tags (many-to-many) junction table
echo "Creating articles_tags junction table..."
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

# Add fields to articles_tags junction table
echo "Adding fields to articles_tags..."

# ID field (auto-created)

# articles_id field
curl -X POST "$DIRECTUS_URL/fields/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "articles_id",
    "type": "integer",
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
      "data_type": "integer",
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

# tags_id field
curl -X POST "$DIRECTUS_URL/fields/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "tags_id",
    "type": "integer",
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
      "data_type": "integer",
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

# 2. Add many-to-many field to articles collection for tags
echo "Adding tags relation field to articles..."
curl -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "tags",
    "type": "alias",
    "meta": {
      "field": "tags",
      "special": ["m2m"],
      "interface": "list-m2m",
      "options": {
        "template": "{{tags_id.name}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{tags_id.name}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 20,
      "width": "full",
      "translations": null,
      "note": "Tags associated with this article",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    }
  }'

# 3. Add many-to-many field to tags collection for articles
echo "Adding articles relation field to tags..."
curl -X POST "$DIRECTUS_URL/fields/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "articles",
    "type": "alias",
    "meta": {
      "field": "articles",
      "special": ["m2m"],
      "interface": "list-m2m",
      "options": {
        "template": "{{articles_id.title}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{articles_id.title}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 10,
      "width": "full",
      "translations": null,
      "note": "Articles tagged with this tag",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    }
  }'

# 4. Create articles ↔ article_series (many-to-one) relation
echo "Adding article_series relation to articles..."
curl -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "article_series_id",
    "type": "integer",
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
      "data_type": "integer",
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

# Add one-to-many field to article_series collection
echo "Adding articles relation field to article_series..."
curl -X POST "$DIRECTUS_URL/fields/article_series" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "articles",
    "type": "alias",
    "meta": {
      "field": "articles",
      "special": ["o2m"],
      "interface": "list-o2m",
      "options": {
        "template": "{{title}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 10,
      "width": "full",
      "translations": null,
      "note": "Articles in this series",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    }
  }'

# 5. Create articles ↔ story_clusters (many-to-many) junction table
echo "Creating articles_story_clusters junction table..."
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

# Add fields to articles_story_clusters junction table
echo "Adding fields to articles_story_clusters..."

# articles_id field
curl -X POST "$DIRECTUS_URL/fields/articles_story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "articles_id",
    "type": "integer",
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
      "data_type": "integer",
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

# story_clusters_id field
curl -X POST "$DIRECTUS_URL/fields/articles_story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "story_clusters_id",
    "type": "integer",
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
      "data_type": "integer",
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

# 6. Add many-to-many field to articles collection for story_clusters
echo "Adding story_clusters relation field to articles..."
curl -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "story_clusters",
    "type": "alias",
    "meta": {
      "field": "story_clusters",
      "special": ["m2m"],
      "interface": "list-m2m",
      "options": {
        "template": "{{story_clusters_id.title}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{story_clusters_id.title}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 22,
      "width": "full",
      "translations": null,
      "note": "Story clusters this article belongs to",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    }
  }'

# 7. Add many-to-many field to story_clusters collection for articles
echo "Adding articles relation field to story_clusters..."
curl -X POST "$DIRECTUS_URL/fields/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "articles",
    "type": "alias",
    "meta": {
      "field": "articles",
      "special": ["m2m"],
      "interface": "list-m2m",
      "options": {
        "template": "{{articles_id.title}}"
      },
      "display": "related-values",
      "display_options": {
        "template": "{{articles_id.title}}"
      },
      "readonly": false,
      "hidden": false,
      "sort": 10,
      "width": "full",
      "translations": null,
      "note": "Articles in this story cluster",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    }
  }'

echo "All missing relations created successfully!"
echo "Relations created:"
echo "1. ✅ articles ↔ tags (many-to-many)"
echo "2. ✅ articles ↔ article_series (many-to-one)"
echo "3. ✅ articles ↔ story_clusters (many-to-many)"
