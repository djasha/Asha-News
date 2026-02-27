#!/bin/bash

# Add relation alias fields to collections for bidirectional relations
# This creates the "reverse" relation fields that allow navigation from both sides

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Adding relation alias fields for bidirectional navigation..."

# 1. Add tags relation field to articles collection (many-to-many via articles_tags)
echo "Adding tags field to articles collection..."
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
      "sort": 22,
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

# 2. Add articles relation field to tags collection (many-to-many via articles_tags)
echo "Adding articles field to tags collection..."
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
      "sort": 6,
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

# 3. Add story_clusters relation field to articles collection (many-to-many via articles_story_clusters)
echo "Adding story_clusters field to articles collection..."
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
      "sort": 23,
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

# 4. Add articles relation field to story_clusters collection (many-to-many via articles_story_clusters)
echo "Adding articles field to story_clusters collection..."
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
      "sort": 6,
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

# 5. Add articles relation field to article_series collection (one-to-many)
echo "Adding articles field to article_series collection..."
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
      "sort": 6,
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

echo "Relation alias fields added successfully!"
echo "Added bidirectional relations:"
echo "- articles ↔ tags (many-to-many)"
echo "- articles ↔ story_clusters (many-to-many)"
echo "- articles → article_series (many-to-one)"
echo "- article_series → articles (one-to-many)"
