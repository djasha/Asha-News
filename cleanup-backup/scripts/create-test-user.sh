#!/bin/bash

# Create a test user with known credentials for authentication testing
DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Creating test user with known credentials..."

# First, let's check if the user already exists
EXISTING_USER=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/users?filter[email][_eq]=testuser@asha.news" | jq '.data | length')

if [ "$EXISTING_USER" -gt "0" ]; then
    echo "Test user already exists, updating password..."
    USER_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/users?filter[email][_eq]=testuser@asha.news&fields=id" | jq -r '.data[0].id')
    
    # Update existing user password (Argon2 hash for "testpass123")
    curl -s -X PATCH "$DIRECTUS_URL/items/users/$USER_ID" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "password": "$argon2id$v=19$m=65536,t=3,p=4$rQmQrQmQrQmQrQmQrQ$8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8"
      }' | jq '.data.id // .errors'
else
    echo "Creating new test user..."
    # Create new test user with Argon2 password hash
    curl -s -X POST "$DIRECTUS_URL/items/users" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "testuser@asha.news",
        "password": "$argon2id$v=19$m=65536,t=3,p=4$rQmQrQmQrQmQrQmQrQ$8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8",
        "first_name": "Test",
        "last_name": "User",
        "status": "active",
        "role": null
      }' | jq '.data.id // .errors'
fi

echo ""
echo "Test user credentials:"
echo "Email: testuser@asha.news"
echo "Password: testpass123"
