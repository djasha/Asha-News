#!/bin/bash

# Create Super Admin User with Full Access
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"
SUPER_EMAIL="super@asha.news"
SUPER_PASSWORD="SuperAdmin123"

echo "🔐 Getting admin token..."
TOKEN=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Create Administrator role with full access
echo "👑 Creating Administrator role..."
ADMIN_ROLE_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Administrator",
    "icon": "verified_user",
    "description": "Full system access",
    "admin_access": true,
    "app_access": true
  }')

ADMIN_ROLE_ID=$(echo "$ADMIN_ROLE_RESPONSE" | jq -r '.data.id // empty')

if [ -z "$ADMIN_ROLE_ID" ]; then
  echo "⚠️  Using existing admin role"
  ADMIN_ROLE_ID="8499439b-65dc-4309-ae2e-994521653e08"
else
  echo "✅ Created admin role: $ADMIN_ROLE_ID"
fi

# Create super admin user
echo "👤 Creating super admin user..."
curl -s -X POST "$DIRECTUS_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$SUPER_EMAIL\",
    \"password\": \"$SUPER_PASSWORD\",
    \"role\": \"$ADMIN_ROLE_ID\",
    \"status\": \"active\",
    \"first_name\": \"Super\",
    \"last_name\": \"Admin\"
  }" > /dev/null

echo "✅ Super admin user created!"

# Test login with super admin
echo "🧪 Testing super admin login..."
SUPER_TOKEN=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SUPER_EMAIL\",\"password\":\"$SUPER_PASSWORD\"}" | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$SUPER_TOKEN" ]; then
  echo "✅ Super admin login successful!"
  
  # Test collection access
  echo "🧪 Testing collection access..."
  RESPONSE=$(curl -s -H "Authorization: Bearer $SUPER_TOKEN" "$DIRECTUS_URL/items/topic_categories")
  if echo "$RESPONSE" | grep -q '"data"'; then
    echo "✅ Collections accessible!"
  else
    echo "❌ Collections still not accessible"
    echo "Response: $RESPONSE"
  fi
else
  echo "❌ Super admin login failed"
fi

echo "🎉 Setup completed!"
echo "🔗 Login credentials:"
echo "   Email: $SUPER_EMAIL"
echo "   Password: $SUPER_PASSWORD"
echo "   URL: $DIRECTUS_URL"
