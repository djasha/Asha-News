#!/bin/bash

# Test authentication flow with registration and login
BACKEND_URL="http://localhost:3001"

echo "=== AUTHENTICATION FLOW TEST ==="
echo ""

# Test 1: Register a new user
echo "1. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@asha.news",
    "password": "securepass123",
    "firstName": "New",
    "lastName": "User"
  }')

echo "Registration response:"
echo "$REGISTER_RESPONSE" | jq '.'

# Extract user info if registration successful
USER_EMAIL=$(echo "$REGISTER_RESPONSE" | jq -r '.user.email // empty')
if [ "$USER_EMAIL" != "" ]; then
    echo "✅ Registration successful for: $USER_EMAIL"
    
    # Test 2: Login with the new user
    echo ""
    echo "2. Testing login with new user..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "newuser@asha.news",
        "password": "securepass123"
      }')
    
    echo "Login response:"
    echo "$LOGIN_RESPONSE" | jq '.'
    
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken // empty')
    if [ "$ACCESS_TOKEN" != "" ]; then
        echo "✅ Login successful, got access token"
        
        # Test 3: Access protected endpoint
        echo ""
        echo "3. Testing protected endpoint access..."
        PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
          "$BACKEND_URL/api/auth/profile")
        
        echo "Profile response:"
        echo "$PROFILE_RESPONSE" | jq '.'
        
        PROFILE_EMAIL=$(echo "$PROFILE_RESPONSE" | jq -r '.user.email // empty')
        if [ "$PROFILE_EMAIL" = "newuser@asha.news" ]; then
            echo "✅ Protected endpoint access successful"
        else
            echo "❌ Protected endpoint access failed"
        fi
    else
        echo "❌ Login failed"
    fi
else
    echo "❌ Registration failed, trying with existing user..."
    
    # Test with existing user from Directus
    echo ""
    echo "2. Testing login with existing user..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@asha.news",
        "password": "AdminPass123"
      }')
    
    echo "Login response:"
    echo "$LOGIN_RESPONSE" | jq '.'
fi

echo ""
echo "=== AUTHENTICATION TEST COMPLETE ==="
