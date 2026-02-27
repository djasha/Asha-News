#!/bin/bash

# Create API Configuration Collections for Directus
# This script creates collections to manage all API credentials and configurations

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Creating API configuration collections..."

# Create api_configurations collection
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "api_configurations",
    "meta": {
      "collection": "api_configurations",
      "icon": "settings",
      "note": "API credentials and configuration management",
      "display_template": "{{service_name}} - {{environment}}",
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
      "sort": null,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "api_configurations"
    }
  }'

echo "Creating fields for api_configurations..."

# ID field (auto-created)

# Service name field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "service_name",
    "type": "string",
    "meta": {
      "field": "service_name",
      "special": null,
      "interface": "input",
      "options": {
        "placeholder": "e.g., Google OAuth, OpenAI, News API"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 1,
      "width": "half",
      "translations": null,
      "note": "Name of the API service",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "service_name",
      "table": "api_configurations",
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

# Environment field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "environment",
    "type": "string",
    "meta": {
      "field": "environment",
      "special": null,
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Development", "value": "development"},
          {"text": "Testing", "value": "testing"},
          {"text": "Production", "value": "production"}
        ]
      },
      "display": "labels",
      "display_options": {
        "choices": [
          {"text": "Development", "value": "development", "foreground": "#FFFFFF", "background": "#2196F3"},
          {"text": "Testing", "value": "testing", "foreground": "#FFFFFF", "background": "#FF9800"},
          {"text": "Production", "value": "production", "foreground": "#FFFFFF", "background": "#4CAF50"}
        ]
      },
      "readonly": false,
      "hidden": false,
      "sort": 2,
      "width": "half",
      "translations": null,
      "note": "Environment this configuration applies to",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "environment",
      "table": "api_configurations",
      "data_type": "varchar",
      "default_value": "development",
      "max_length": 50,
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

# API Key field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "api_key",
    "type": "string",
    "meta": {
      "field": "api_key",
      "special": null,
      "interface": "input",
      "options": {
        "masked": true,
        "placeholder": "Enter API key"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 3,
      "width": "full",
      "translations": null,
      "note": "API key or token",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "api_key",
      "table": "api_configurations",
      "data_type": "text",
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
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

# Client ID field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "client_id",
    "type": "string",
    "meta": {
      "field": "client_id",
      "special": null,
      "interface": "input",
      "options": {
        "placeholder": "OAuth Client ID"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 4,
      "width": "half",
      "translations": null,
      "note": "OAuth Client ID (for OAuth services)",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "client_id",
      "table": "api_configurations",
      "data_type": "varchar",
      "default_value": null,
      "max_length": 500,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": true,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

# Client Secret field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "client_secret",
    "type": "string",
    "meta": {
      "field": "client_secret",
      "special": null,
      "interface": "input",
      "options": {
        "masked": true,
        "placeholder": "OAuth Client Secret"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 5,
      "width": "half",
      "translations": null,
      "note": "OAuth Client Secret (for OAuth services)",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "client_secret",
      "table": "api_configurations",
      "data_type": "text",
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
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

# Base URL field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "base_url",
    "type": "string",
    "meta": {
      "field": "base_url",
      "special": null,
      "interface": "input",
      "options": {
        "placeholder": "https://api.example.com"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 6,
      "width": "full",
      "translations": null,
      "note": "Base URL for the API",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "base_url",
      "table": "api_configurations",
      "data_type": "varchar",
      "default_value": null,
      "max_length": 500,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": true,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

# Configuration JSON field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "configuration",
    "type": "json",
    "meta": {
      "field": "configuration",
      "special": ["cast-json"],
      "interface": "input-code",
      "options": {
        "language": "json",
        "placeholder": "Additional configuration as JSON"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 7,
      "width": "full",
      "translations": null,
      "note": "Additional configuration parameters as JSON",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "configuration",
      "table": "api_configurations",
      "data_type": "json",
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
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

# Status field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "status",
    "type": "string",
    "meta": {
      "field": "status",
      "special": null,
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Active", "value": "active"},
          {"text": "Inactive", "value": "inactive"},
          {"text": "Testing", "value": "testing"}
        ]
      },
      "display": "labels",
      "display_options": {
        "choices": [
          {"text": "Active", "value": "active", "foreground": "#FFFFFF", "background": "#4CAF50"},
          {"text": "Inactive", "value": "inactive", "foreground": "#FFFFFF", "background": "#F44336"},
          {"text": "Testing", "value": "testing", "foreground": "#FFFFFF", "background": "#FF9800"}
        ]
      },
      "readonly": false,
      "hidden": false,
      "sort": 8,
      "width": "half",
      "translations": null,
      "note": "Status of this API configuration",
      "conditions": null,
      "required": true,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "status",
      "table": "api_configurations",
      "data_type": "varchar",
      "default_value": "active",
      "max_length": 50,
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

# Description field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "description",
    "type": "text",
    "meta": {
      "field": "description",
      "special": null,
      "interface": "input-multiline",
      "options": {
        "placeholder": "Description of this API configuration"
      },
      "display": "raw",
      "display_options": null,
      "readonly": false,
      "hidden": false,
      "sort": 9,
      "width": "full",
      "translations": null,
      "note": "Description of this API configuration",
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "description",
      "table": "api_configurations",
      "data_type": "text",
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
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

# Created at field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "created_at",
    "type": "timestamp",
    "meta": {
      "field": "created_at",
      "special": ["date-created"],
      "interface": "datetime",
      "options": null,
      "display": "datetime",
      "display_options": {
        "relative": true
      },
      "readonly": true,
      "hidden": true,
      "sort": 10,
      "width": "half",
      "translations": null,
      "note": null,
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "created_at",
      "table": "api_configurations",
      "data_type": "timestamp",
      "default_value": "CURRENT_TIMESTAMP",
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": true,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

# Updated at field
curl -X POST "$DIRECTUS_URL/fields/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "updated_at",
    "type": "timestamp",
    "meta": {
      "field": "updated_at",
      "special": ["date-updated"],
      "interface": "datetime",
      "options": null,
      "display": "datetime",
      "display_options": {
        "relative": true
      },
      "readonly": true,
      "hidden": true,
      "sort": 11,
      "width": "half",
      "translations": null,
      "note": null,
      "conditions": null,
      "required": false,
      "group": null,
      "validation": null,
      "validation_message": null
    },
    "schema": {
      "name": "updated_at",
      "table": "api_configurations",
      "data_type": "timestamp",
      "default_value": "CURRENT_TIMESTAMP",
      "max_length": null,
      "numeric_precision": null,
      "numeric_scale": null,
      "is_nullable": true,
      "is_unique": false,
      "is_primary_key": false,
      "is_generated": false,
      "generation_expression": null,
      "has_auto_increment": false,
      "foreign_key_column": null,
      "foreign_key_table": null
    }
  }'

echo "API configurations collection created successfully!"
echo "Now populating with initial API configurations..."

# Add Google OAuth configuration
curl -X POST "$DIRECTUS_URL/items/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "Google OAuth",
    "environment": "development",
    "client_id": "",
    "client_secret": "",
    "base_url": "https://accounts.google.com",
    "configuration": {
      "scope": ["profile", "email"],
      "redirect_uri": "http://localhost:3001/api/auth/google/callback"
    },
    "status": "inactive",
    "description": "Google OAuth 2.0 authentication for user login"
  }'

# Add OpenAI configuration
curl -X POST "$DIRECTUS_URL/items/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "OpenAI",
    "environment": "development",
    "api_key": "",
    "base_url": "https://api.openai.com/v1",
    "configuration": {
      "model": "gpt-4",
      "max_tokens": 2000,
      "temperature": 0.7
    },
    "status": "inactive",
    "description": "OpenAI API for AI analysis and content generation"
  }'

# Add News API configuration
curl -X POST "$DIRECTUS_URL/items/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "News API",
    "environment": "development",
    "api_key": "",
    "base_url": "https://newsapi.org/v2",
    "configuration": {
      "country": "us",
      "pageSize": 100,
      "sortBy": "publishedAt"
    },
    "status": "inactive",
    "description": "News API for fetching news articles"
  }'

# Add MediaStack API configuration
curl -X POST "$DIRECTUS_URL/items/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "MediaStack",
    "environment": "development",
    "api_key": "",
    "base_url": "http://api.mediastack.com/v1",
    "configuration": {
      "countries": "us,gb,ca",
      "limit": 100,
      "sort": "published_desc"
    },
    "status": "inactive",
    "description": "MediaStack API for news aggregation"
  }'

# Add Fact Check API configuration
curl -X POST "$DIRECTUS_URL/items/api_configurations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "Fact Check API",
    "environment": "development",
    "api_key": "",
    "base_url": "https://factchecktools.googleapis.com/v1alpha1",
    "configuration": {
      "languageCode": "en-US",
      "maxAgeDays": 7
    },
    "status": "inactive",
    "description": "Google Fact Check Tools API for claim verification"
  }'

echo "Initial API configurations added successfully!"
echo "You can now manage all API credentials through the Directus admin panel."
