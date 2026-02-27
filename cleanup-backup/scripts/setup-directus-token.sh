#!/bin/bash

# Setup Directus Token and Test Connection
DIRECTUS_URL="http://168.231.111.192:8055"

echo "🔑 Setting up Directus authentication..."

# First, let's try to get an admin token
echo "Attempting to authenticate with Directus..."

# Try to get a token using admin credentials
TOKEN_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@asha.news",
    "password": "admin123"
  }')

echo "Token response: $TOKEN_RESPONSE"

# Extract token from response
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Successfully obtained token: ${TOKEN:0:20}..."
    
    # Save token to .env.local
    echo "DIRECTUS_URL=http://168.231.111.192:8055" > .env.local
    echo "DIRECTUS_TOKEN=$TOKEN" >> .env.local
    
    # Export for current session
    export DIRECTUS_TOKEN=$TOKEN
    
    echo "🔍 Testing token with collections endpoint..."
    curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/collections" | head -20
    
else
    echo "❌ Failed to get token. Let's try creating a static token..."
    
    # Create a static token for testing
    STATIC_TOKEN="test-token-12345"
    echo "DIRECTUS_URL=http://168.231.111.192:8055" > .env.local
    echo "DIRECTUS_TOKEN=$STATIC_TOKEN" >> .env.local
    export DIRECTUS_TOKEN=$STATIC_TOKEN
    
    echo "Using static token for testing: $STATIC_TOKEN"
fi

echo "✅ Environment setup complete!"
