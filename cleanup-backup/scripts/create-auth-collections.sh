#!/bin/bash

# Create Directus Authentication Collections
# This script creates all necessary collections for user authentication, sessions, and security

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔐 Creating Directus Authentication Collections..."

# 1. Users Collection (extends directus_users)
echo "Creating users collection..."
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "users",
    "meta": {
      "collection": "users",
      "icon": "person",
      "note": "User accounts and profiles",
      "display_template": "{{first_name}} {{last_name}} ({{email}})",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": "status",
      "archive_value": "archived",
      "unarchive_value": "active",
      "archive_app_filter": true,
      "sort_field": "created_at"
    },
    "schema": {
      "name": "users"
    }
  }'

# Add fields to users collection
echo "Adding fields to users collection..."

# Email field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "email",
    "type": "string",
    "meta": {
      "field": "email",
      "special": null,
      "interface": "input",
      "options": {"trim": true},
      "display": null,
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 1,
      "width": "full",
      "translations": null,
      "note": "User email address",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": {
        "_and": [
          {"email": {"_nnull": true}},
          {"email": {"_regex": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"}}
        ]
      },
      "validation_message": "Please enter a valid email address"
    },
    "schema": {
      "name": "email",
      "table": "users",
      "data_type": "varchar",
      "default_value": null,
      "max_length": 255,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": true,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null,
      "comment": ""
    }
  }'

# Password field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "password",
    "type": "hash",
    "meta": {
      "field": "password",
      "special": ["hash"],
      "interface": "input-hash",
      "options": null,
      "display": null,
      "display_options": null,
      "readonly": false,
      "hidden": true,
      "sort": 2,
      "width": "full",
      "translations": null,
      "note": "User password (hashed)",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "password",
      "table": "users",
      "data_type": "varchar",
      "default_value": null,
      "max_length": 255,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null,
      "comment": ""
    }
  }'

# First name field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "first_name",
    "type": "string",
    "meta": {
      "field": "first_name",
      "special": null,
      "interface": "input",
      "options": {"trim": true},
      "display": null,
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 3,
      "width": "half",
      "translations": null,
      "note": "User first name",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "first_name",
      "table": "users",
      "data_type": "varchar",
      "default_value": null,
      "max_length": 100,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null,
      "comment": ""
    }
  }'

# Last name field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "last_name",
    "type": "string",
    "meta": {
      "field": "last_name",
      "special": null,
      "interface": "input",
      "options": {"trim": true},
      "display": null,
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 4,
      "width": "half",
      "translations": null,
      "note": "User last name",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "last_name",
      "table": "users",
      "data_type": "varchar",
      "default_value": null,
      "max_length": 100,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null,
      "comment": ""
    }
  }'

# Role field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "role",
    "type": "string",
    "meta": {
      "field": "role",
      "special": null,
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "User", "value": "user"},
          {"text": "Admin", "value": "admin"},
          {"text": "Editor", "value": "editor"},
          {"text": "Moderator", "value": "moderator"}
        ]
      },
      "display": "labels",
      "display_options": {
        "choices": [
          {"text": "User", "value": "user", "foreground": "#FFFFFF", "background": "#6366F1"},
          {"text": "Admin", "value": "admin", "foreground": "#FFFFFF", "background": "#DC2626"},
          {"text": "Editor", "value": "editor", "foreground": "#FFFFFF", "background": "#059669"},
          {"text": "Moderator", "value": "moderator", "foreground": "#FFFFFF", "background": "#D97706"}
        ]
      },
      "readonly": false,
      "hidden": false,
      "sort": 5,
      "width": "half",
      "translations": null,
      "note": "User role and permissions",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "role",
      "table": "users",
      "data_type": "varchar",
      "default_value": "user",
      "max_length": 50,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null,
      "comment": ""
    }
  }'

# Subscription field
curl -X POST "$DIRECTUS_URL/fields/users" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "subscription",
    "type": "string",
    "meta": {
      "field": "subscription",
      "special": null,
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Free", "value": "free"},
          {"text": "Premium", "value": "premium"},
          {"text": "Pro", "value": "pro"}
        ]
      },
      "display": "labels",
      "display_options": {
        "choices": [
          {"text": "Free", "value": "free", "foreground": "#FFFFFF", "background": "#6B7280"},
          {"text": "Premium", "value": "premium", "foreground": "#FFFFFF", "background": "#F59E0B"},
          {"text": "Pro", "value": "pro", "foreground": "#FFFFFF", "background": "#8B5CF6"}
        ]
      },
      "readonly": false,
      "hidden": false,
      "sort": 6,
      "width": "half",
      "translations": null,
      "note": "User subscription tier",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "subscription",
      "table": "users",
      "data_type": "varchar",
      "default_value": "free",
      "max_length": 50,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": false,
      "is_unique": false,
      "is_primary_key": false,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null,
      "comment": ""
    }
  }'

echo "✅ Authentication collections created successfully!"
