#!/bin/bash

# Comprehensive Directus Schema Setup for Asha News CMS
# Creates all collections needed for full CMS management

set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Comprehensive Directus CMS Schema Setup ==="

# Get admin token
echo "🔐 Getting admin token..."
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Function to create collection
create_collection() {
  local collection_name="$1"
  local icon="$2"
  local note="$3"
  local singleton="${4:-false}"
  
  echo "📁 Creating collection: $collection_name"
  
  local singleton_param=""
  if [ "$singleton" = "true" ]; then
    singleton_param='"singleton": true,'
  fi
  
  curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"collection\": \"$collection_name\",
      \"meta\": {
        \"icon\": \"$icon\",
        \"note\": \"$note\",
        $singleton_param
        \"hidden\": false
      }
    }" > /dev/null
}

# Function to create field
create_field() {
  local collection="$1"
  local field_name="$2"
  local field_type="$3"
  local interface="$4"
  local note="$5"
  local required="${6:-false}"
  
  local required_param=""
  if [ "$required" = "true" ]; then
    required_param='"required": true,'
  fi
  
  curl -s -X POST "$DIRECTUS_URL/fields/$collection" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"field\": \"$field_name\",
      \"type\": \"$field_type\",
      \"meta\": {
        \"interface\": \"$interface\",
        \"note\": \"$note\",
        $required_param
        \"hidden\": false
      }
    }" > /dev/null
}

# Priority 1: Core Content Management Collections

echo "🏗️  Creating Priority 1 Collections..."

# Site Configuration (singleton)
create_collection "site_configuration" "settings" "Global site configuration and settings" "true"
create_field "site_configuration" "site_name" "string" "input" "Site name" "true"
create_field "site_configuration" "site_description" "text" "input-multiline" "Site description"
create_field "site_configuration" "contact_email" "string" "input" "Contact email address"
create_field "site_configuration" "support_email" "string" "input" "Support email address"
create_field "site_configuration" "social_twitter" "string" "input" "Twitter/X handle"
create_field "site_configuration" "social_facebook" "string" "input" "Facebook page URL"
create_field "site_configuration" "social_linkedin" "string" "input" "LinkedIn page URL"
create_field "site_configuration" "analytics_ga_id" "string" "input" "Google Analytics ID"
create_field "site_configuration" "seo_default_title" "string" "input" "Default SEO title"
create_field "site_configuration" "seo_default_description" "text" "input-multiline" "Default SEO description"
create_field "site_configuration" "seo_default_keywords" "text" "input-multiline" "Default SEO keywords"

# Navigation Menus
create_collection "navigation_menus" "menu" "Navigation menu configurations"
create_field "navigation_menus" "name" "string" "input" "Menu name" "true"
create_field "navigation_menus" "location" "string" "select-dropdown" "Menu location (header, footer, mobile)"
create_field "navigation_menus" "enabled" "boolean" "boolean" "Enable this menu"
create_field "navigation_menus" "sort_order" "integer" "input" "Display order"

# Menu Items
create_collection "menu_items" "list" "Individual menu items"
create_field "menu_items" "title" "string" "input" "Menu item title" "true"
create_field "menu_items" "url" "string" "input" "URL or path"
create_field "menu_items" "icon" "string" "input" "Icon name"
create_field "menu_items" "target" "string" "select-dropdown" "Link target (_self, _blank)"
create_field "menu_items" "enabled" "boolean" "boolean" "Enable this menu item"
create_field "menu_items" "sort_order" "integer" "input" "Display order"
create_field "menu_items" "parent_menu" "uuid" "select-dropdown-m2o" "Parent menu"

# Topic Categories
create_collection "topic_categories" "category" "News topic categories"
create_field "topic_categories" "name" "string" "input" "Category name" "true"
create_field "topic_categories" "slug" "string" "input" "URL slug" "true"
create_field "topic_categories" "description" "text" "input-multiline" "Category description"
create_field "topic_categories" "color" "string" "input" "Category color (hex)"
create_field "topic_categories" "icon" "string" "input" "Category icon"
create_field "topic_categories" "enabled" "boolean" "boolean" "Enable this category"
create_field "topic_categories" "sort_order" "integer" "input" "Display order"
create_field "topic_categories" "article_count" "integer" "input" "Number of articles (auto-calculated)"

# Enhanced News Sources
create_collection "news_sources" "rss_feed" "Complete news source profiles"
create_field "news_sources" "name" "string" "input" "Source name" "true"
create_field "news_sources" "domain" "string" "input" "Website domain"
create_field "news_sources" "rss_url" "string" "input" "RSS feed URL"
create_field "news_sources" "bias_rating" "string" "select-dropdown" "Political bias (left, center, right)"
create_field "news_sources" "credibility_score" "float" "input" "Credibility score (0-5)"
create_field "news_sources" "factual_accuracy" "float" "input" "Factual accuracy score (0-5)"
create_field "news_sources" "bias_transparency" "float" "input" "Bias transparency score (0-5)"
create_field "news_sources" "ownership" "string" "input" "Ownership information"
create_field "news_sources" "funding" "string" "input" "Funding model"
create_field "news_sources" "geographic_coverage" "string" "input" "Geographic coverage"
create_field "news_sources" "logo_url" "string" "input" "Logo image URL"
create_field "news_sources" "description" "text" "input-multiline" "Source description"
create_field "news_sources" "enabled" "boolean" "boolean" "Enable this source"

# Legal Pages
create_collection "legal_pages" "gavel" "Legal and policy pages"
create_field "legal_pages" "title" "string" "input" "Page title" "true"
create_field "legal_pages" "slug" "string" "input" "URL slug" "true"
create_field "legal_pages" "content" "text" "input-rich-text-html" "Page content"
create_field "legal_pages" "last_updated" "timestamp" "datetime" "Last updated date"
create_field "legal_pages" "version" "string" "input" "Version number"
create_field "legal_pages" "published" "boolean" "boolean" "Published status"

echo "🏗️  Creating Priority 2 Collections..."

# Articles
create_collection "articles" "article" "News articles and content"
create_field "articles" "title" "string" "input" "Article title" "true"
create_field "articles" "slug" "string" "input" "URL slug" "true"
create_field "articles" "summary" "text" "input-multiline" "Article summary"
create_field "articles" "content" "text" "input-rich-text-html" "Full article content"
create_field "articles" "url" "string" "input" "Original article URL"
create_field "articles" "publication_date" "timestamp" "datetime" "Publication date"
create_field "articles" "author" "string" "input" "Article author"
create_field "articles" "source_id" "uuid" "select-dropdown-m2o" "News source"
create_field "articles" "topic_category" "uuid" "select-dropdown-m2o" "Topic category"
create_field "articles" "political_bias" "string" "select-dropdown" "Political bias"
create_field "articles" "factual_quality" "float" "input" "Factual quality score"
create_field "articles" "confidence_score" "float" "input" "AI confidence score"
create_field "articles" "featured" "boolean" "boolean" "Featured article"
create_field "articles" "breaking_news" "boolean" "boolean" "Breaking news"
create_field "articles" "published" "boolean" "boolean" "Published status"

# Homepage Sections
create_collection "homepage_sections" "home" "Homepage content sections"
create_field "homepage_sections" "name" "string" "input" "Section name" "true"
create_field "homepage_sections" "title" "string" "input" "Display title"
create_field "homepage_sections" "description" "text" "input-multiline" "Section description"
create_field "homepage_sections" "enabled" "boolean" "boolean" "Enable this section"
create_field "homepage_sections" "sort_order" "integer" "input" "Display order"
create_field "homepage_sections" "max_articles" "integer" "input" "Maximum articles to show"
create_field "homepage_sections" "section_type" "string" "select-dropdown" "Section type"

# Page Content
create_collection "page_content" "description" "Static page content management"
create_field "page_content" "page_name" "string" "input" "Page identifier" "true"
create_field "page_content" "title" "string" "input" "Page title"
create_field "page_content" "content" "text" "input-rich-text-html" "Page content"
create_field "page_content" "meta_title" "string" "input" "SEO meta title"
create_field "page_content" "meta_description" "text" "input-multiline" "SEO meta description"
create_field "page_content" "meta_keywords" "text" "input-multiline" "SEO keywords"
create_field "page_content" "published" "boolean" "boolean" "Published status"
create_field "page_content" "last_updated" "timestamp" "datetime" "Last updated"

echo "🏗️  Creating Priority 3 Collections..."

# Breaking News
create_collection "breaking_news" "warning" "Breaking news alerts"
create_field "breaking_news" "headline" "string" "input" "Breaking news headline" "true"
create_field "breaking_news" "summary" "text" "input-multiline" "Brief summary"
create_field "breaking_news" "url" "string" "input" "Related article URL"
create_field "breaking_news" "priority" "string" "select-dropdown" "Priority level (high, medium, low)"
create_field "breaking_news" "active" "boolean" "boolean" "Active alert"
create_field "breaking_news" "expires_at" "timestamp" "datetime" "Expiration date"
create_field "breaking_news" "created_at" "timestamp" "datetime" "Created date"

# Daily Briefs
create_collection "daily_briefs" "schedule" "Daily news briefings"
create_field "daily_briefs" "title" "string" "input" "Brief title" "true"
create_field "daily_briefs" "time_period" "string" "select-dropdown" "Time period (morning, midday, evening)"
create_field "daily_briefs" "content" "text" "input-rich-text-html" "Brief content"
create_field "daily_briefs" "date" "date" "datetime" "Brief date"
create_field "daily_briefs" "published" "boolean" "boolean" "Published status"
create_field "daily_briefs" "featured_articles" "json" "input-code" "Featured article IDs (JSON array)"

# Trending Topics
create_collection "trending_topics" "trending_up" "Trending topics and hashtags"
create_field "trending_topics" "name" "string" "input" "Topic name" "true"
create_field "trending_topics" "hashtag" "string" "input" "Associated hashtag"
create_field "trending_topics" "description" "text" "input-multiline" "Topic description"
create_field "trending_topics" "trend_score" "float" "input" "Trending score"
create_field "trending_topics" "article_count" "integer" "input" "Number of related articles"
create_field "trending_topics" "active" "boolean" "boolean" "Currently trending"
create_field "trending_topics" "created_at" "timestamp" "datetime" "First detected"

echo "✅ All collections created successfully!"

# Set up permissions for Administrator policy
ADMIN_POLICY_ID="f66a5e36-eab2-461f-8903-2d50e008c9f7"

echo "🔐 Setting up permissions..."

# Collections to set permissions for
collections=(
  "site_configuration"
  "navigation_menus"
  "menu_items"
  "topic_categories"
  "news_sources"
  "legal_pages"
  "articles"
  "homepage_sections"
  "page_content"
  "breaking_news"
  "daily_briefs"
  "trending_topics"
)

# Actions to permit
actions=("create" "read" "update" "delete")

for collection in "${collections[@]}"; do
  for action in "${actions[@]}"; do
    curl -s -X POST "$DIRECTUS_URL/permissions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"collection\": \"$collection\",
        \"action\": \"$action\",
        \"policy\": \"$ADMIN_POLICY_ID\",
        \"fields\": [\"*\"]
      }" > /dev/null
  done
done

echo "✅ Permissions configured!"

echo "🎉 Comprehensive Directus CMS schema setup completed!"
echo "📊 Created $(echo ${#collections[@]}) new collections with full CRUD permissions"
echo "🔗 Access your Directus admin panel at: $DIRECTUS_URL"
