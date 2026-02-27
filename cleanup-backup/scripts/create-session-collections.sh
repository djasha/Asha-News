#!/bin/bash

# Create Session Management Collections for Directus Authentication
DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔐 Creating Session Management Collections..."

# 2. Refresh Tokens Collection
echo "Creating refresh_tokens collection..."
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "refresh_tokens",
    "meta": {
      "collection": "refresh_tokens",
      "icon": "vpn_key",
      "note": "User refresh tokens for authentication",
      "display_template": "{{user_id}} - {{created_at}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "created_at"
    },
    "schema": {
      "name": "refresh_tokens"
    }
  }'

# Add fields to refresh_tokens
curl -X POST "$DIRECTUS_URL/fields/refresh_tokens" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "token",
    "type": "string",
    "meta": {
      "field": "token",
      "interface": "input",
      "options": {"trim": true},
      "readonly": false,
      "hidden": true,
      "sort": 1,
      "width": "full",
      "note": "Refresh token value",
      "required": true
    },
    "schema": {
      "name": "token",
      "table": "refresh_tokens",
      "data_type": "varchar",
      "max_length": 500,
      "is_nullable": false,
      "is_unique": true
    }
  }'

curl -X POST "$DIRECTUS_URL/fields/refresh_tokens" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "user_id",
    "type": "string",
    "meta": {
      "field": "user_id",
      "interface": "input",
      "readonly": false,
      "hidden": false,
      "sort": 2,
      "width": "half",
      "note": "Associated user ID",
      "required": true
    },
    "schema": {
      "name": "user_id",
      "table": "refresh_tokens",
      "data_type": "varchar",
      "max_length": 100,
      "is_nullable": false
    }
  }'

curl -X POST "$DIRECTUS_URL/fields/refresh_tokens" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "expires_at",
    "type": "timestamp",
    "meta": {
      "field": "expires_at",
      "interface": "datetime",
      "readonly": false,
      "hidden": false,
      "sort": 3,
      "width": "half",
      "note": "Token expiration time",
      "required": true
    },
    "schema": {
      "name": "expires_at",
      "table": "refresh_tokens",
      "data_type": "timestamp",
      "is_nullable": false
    }
  }'

# 3. Password Reset Tokens Collection
echo "Creating password_reset_tokens collection..."
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "password_reset_tokens",
    "meta": {
      "collection": "password_reset_tokens",
      "icon": "lock_reset",
      "note": "Password reset tokens",
      "display_template": "{{email}} - {{created_at}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "created_at"
    },
    "schema": {
      "name": "password_reset_tokens"
    }
  }'

# Add fields to password_reset_tokens
curl -X POST "$DIRECTUS_URL/fields/password_reset_tokens" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "token",
    "type": "string",
    "meta": {
      "field": "token",
      "interface": "input",
      "readonly": false,
      "hidden": true,
      "sort": 1,
      "width": "full",
      "note": "Reset token value",
      "required": true
    },
    "schema": {
      "name": "token",
      "table": "password_reset_tokens",
      "data_type": "varchar",
      "max_length": 255,
      "is_nullable": false,
      "is_unique": true
    }
  }'

curl -X POST "$DIRECTUS_URL/fields/password_reset_tokens" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "email",
    "type": "string",
    "meta": {
      "field": "email",
      "interface": "input",
      "readonly": false,
      "hidden": false,
      "sort": 2,
      "width": "half",
      "note": "User email for reset",
      "required": true
    },
    "schema": {
      "name": "email",
      "table": "password_reset_tokens",
      "data_type": "varchar",
      "max_length": 255,
      "is_nullable": false
    }
  }'

curl -X POST "$DIRECTUS_URL/fields/password_reset_tokens" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "expires_at",
    "type": "timestamp",
    "meta": {
      "field": "expires_at",
      "interface": "datetime",
      "readonly": false,
      "hidden": false,
      "sort": 3,
      "width": "half",
      "note": "Token expiration time",
      "required": true
    },
    "schema": {
      "name": "expires_at",
      "table": "password_reset_tokens",
      "data_type": "timestamp",
      "is_nullable": false
    }
  }'

# Add common fields to users collection
echo "Adding additional fields to users collection..."

# Status field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "status",
    "type": "string",
    "meta": {
      "field": "status",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Active", "value": "active"},
          {"text": "Inactive", "value": "inactive"},
          {"text": "Suspended", "value": "suspended"},
          {"text": "Archived", "value": "archived"}
        ]
      },
      "display": "labels",
      "display_options": {
        "choices": [
          {"text": "Active", "value": "active", "foreground": "#FFFFFF", "background": "#059669"},
          {"text": "Inactive", "value": "inactive", "foreground": "#FFFFFF", "background": "#6B7280"},
          {"text": "Suspended", "value": "suspended", "foreground": "#FFFFFF", "background": "#DC2626"},
          {"text": "Archived", "value": "archived", "foreground": "#FFFFFF", "background": "#374151"}
        ]
      },
      "readonly": false,
      "hidden": false,
      "sort": 7,
      "width": "half",
      "note": "User account status",
      "required": true
    },
    "schema": {
      "name": "status",
      "table": "users",
      "data_type": "varchar",
      "default_value": "active",
      "max_length": 50,
      "is_nullable": false
    }
  }'

# Verified field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "verified",
    "type": "boolean",
    "meta": {
      "field": "verified",
      "interface": "boolean",
      "readonly": false,
      "hidden": false,
      "sort": 8,
      "width": "half",
      "note": "Email verification status",
      "required": false
    },
    "schema": {
      "name": "verified",
      "table": "users",
      "data_type": "boolean",
      "default_value": false,
      "is_nullable": true
    }
  }'

# Last login field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "last_login",
    "type": "timestamp",
    "meta": {
      "field": "last_login",
      "interface": "datetime",
      "readonly": true,
      "hidden": false,
      "sort": 9,
      "width": "half",
      "note": "Last login timestamp",
      "required": false
    },
    "schema": {
      "name": "last_login",
      "table": "users",
      "data_type": "timestamp",
      "is_nullable": true
    }
  }'

# Preferences field (JSON)
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "preferences",
    "type": "json",
    "meta": {
      "field": "preferences",
      "interface": "input-code",
      "options": {"language": "json"},
      "readonly": false,
      "hidden": false,
      "sort": 10,
      "width": "full",
      "note": "User preferences and settings",
      "required": false
    },
    "schema": {
      "name": "preferences",
      "table": "users",
      "data_type": "json",
      "is_nullable": true
    }
  }'

echo "✅ Session management collections created successfully!"
