#!/bin/bash

# Fix Authentication Collections - Add missing fields and fix permissions
DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Fixing Authentication Collections..."

# Add created_at field to users collection
echo "Adding created_at field to users collection..."
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "created_at",
    "type": "timestamp",
    "meta": {
      "field": "created_at",
      "special": ["date-created"],
      "interface": "datetime",
      "readonly": true,
      "hidden": false,
      "sort": 11,
      "width": "half",
      "note": "Account creation timestamp",
      "required": false
    },
    "schema": {
      "name": "created_at",
      "table": "users",
      "data_type": "timestamp",
      "default_value": "CURRENT_TIMESTAMP",
      "is_nullable": true
    }
  }'

# Add updated_at field to users collection
echo "Adding updated_at field to users collection..."
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "updated_at",
    "type": "timestamp",
    "meta": {
      "field": "updated_at",
      "special": ["date-updated"],
      "interface": "datetime",
      "readonly": true,
      "hidden": false,
      "sort": 12,
      "width": "half",
      "note": "Last update timestamp",
      "required": false
    },
    "schema": {
      "name": "updated_at",
      "table": "users",
      "data_type": "timestamp",
      "default_value": "CURRENT_TIMESTAMP",
      "is_nullable": true
    }
  }'

# Add created_at field to refresh_tokens collection
echo "Adding created_at field to refresh_tokens collection..."
curl -X POST "$DIRECTUS_URL/fields/refresh_tokens" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "created_at",
    "type": "timestamp",
    "meta": {
      "field": "created_at",
      "special": ["date-created"],
      "interface": "datetime",
      "readonly": true,
      "hidden": false,
      "sort": 4,
      "width": "half",
      "note": "Token creation timestamp",
      "required": false
    },
    "schema": {
      "name": "created_at",
      "table": "refresh_tokens",
      "data_type": "timestamp",
      "default_value": "CURRENT_TIMESTAMP",
      "is_nullable": true
    }
  }'

# Add created_at field to password_reset_tokens collection
echo "Adding created_at field to password_reset_tokens collection..."
curl -X POST "$DIRECTUS_URL/fields/password_reset_tokens" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "created_at",
    "type": "timestamp",
    "meta": {
      "field": "created_at",
      "special": ["date-created"],
      "interface": "datetime",
      "readonly": true,
      "hidden": false,
      "sort": 4,
      "width": "half",
      "note": "Token creation timestamp",
      "required": false
    },
    "schema": {
      "name": "created_at",
      "table": "password_reset_tokens",
      "data_type": "timestamp",
      "default_value": "CURRENT_TIMESTAMP",
      "is_nullable": true
    }
  }'

echo "✅ Authentication collections fixed!"
