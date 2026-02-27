#!/bin/bash

# Add Google ID field to users collection in Directus

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Adding Google ID field to users collection..."

# Add google_id field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "google_id",
    "type": "string",
    "meta": {
      "field": "google_id",
      "special": null,
      "interface": "input",
      "options": {
        "placeholder": "Google User ID"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 12,
      "width": "half",
      "translations": null,
      "note": "Google OAuth User ID",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "google_id",
      "table": "users",
      "data_type": "varchar",
      "default_value": null,
      "max_length": 255,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": true,
      "is_unique": true,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

echo "Google ID field added successfully!"
