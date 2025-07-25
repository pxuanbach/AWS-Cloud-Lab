#!/bin/bash

# Script to create pre-seeded users in Cognito Local
# This script should be run after Cognito Local starts

COGNITO_ENDPOINT="http://cognito-local:9229"

echo "Creating pre-seeded users in Cognito Local..."

# Wait for Cognito Local to be ready
echo "Waiting for Cognito Local to be ready..."
while ! nc -z cognito-local 9229; do
    sleep 2
    echo "Still waiting for port 9229..."
done

echo "Cognito Local is ready!"

# Step 1: Create User Pool
echo "Creating User Pool..."
USER_POOL_RESPONSE=$(curl -s -X POST "$COGNITO_ENDPOINT" \
    -H "X-Amz-Target: AWSCognitoIdentityProviderService.CreateUserPool" \
    -H "Content-Type: application/x-amz-json-1.1" \
    -d "{
        \"PoolName\": \"BlogAppUserPool\",
        \"Schema\": [
            {
                \"Name\": \"email\",
                \"AttributeDataType\": \"String\",
                \"Required\": true,
                \"Mutable\": true
            },
            {
                \"Name\": \"name\",
                \"AttributeDataType\": \"String\",
                \"Required\": false,
                \"Mutable\": true
            }
        ],
        \"AutoVerifiedAttributes\": [\"email\"],
        \"UsernameAttributes\": [\"email\"]
    }")

# Extract User Pool ID from response
USER_POOL_ID=$(echo "$USER_POOL_RESPONSE" | grep -o '"Id":"[^"]*"' | sed 's/"Id":"\([^"]*\)"/\1/')
echo "User Pool created with ID: $USER_POOL_ID"

# Step 2: Create User Pool Client
echo "Creating User Pool Client..."
CLIENT_RESPONSE=$(curl -s -X POST "$COGNITO_ENDPOINT" \
    -H "X-Amz-Target: AWSCognitoIdentityProviderService.CreateUserPoolClient" \
    -H "Content-Type: application/x-amz-json-1.1" \
    -d "{
        \"UserPoolId\": \"$USER_POOL_ID\",
        \"ClientName\": \"BlogAppWebClient\",
        \"ExplicitAuthFlows\": [\"ALLOW_USER_PASSWORD_AUTH\", \"ALLOW_REFRESH_TOKEN_AUTH\"],
        \"GenerateSecret\": false
    }")

# Extract Client ID from response
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | grep -o '"ClientId":"[^"]*"' | sed 's/"ClientId":"\([^"]*\)"/\1/')
echo "User Pool Client created with ID: $CLIENT_ID"

echo "User Pool and Client created successfully!"

# Function to create user
create_user() {
    local email=$1
    local password=$2
    local name=$3
    
    echo "Creating user: $email"
    
    # Step 1: Sign up user
    SIGNUP_RESPONSE=$(curl -s -X POST "$COGNITO_ENDPOINT" \
        -H "X-Amz-Target: AWSCognitoIdentityProviderService.SignUp" \
        -H "Content-Type: application/x-amz-json-1.1" \
        -d "{
            \"ClientId\": \"$CLIENT_ID\",
            \"Username\": \"$email\",
            \"Password\": \"$password\",
            \"UserAttributes\": [
                {
                    \"Name\": \"email\",
                    \"Value\": \"$email\"
                },
                {
                    \"Name\": \"name\",
                    \"Value\": \"$name\"
                }
            ]
        }")
    
    echo "SignUp response: $SIGNUP_RESPONSE"
    
    # Step 2: Auto-confirm user
    CONFIRM_RESPONSE=$(curl -s -X POST "$COGNITO_ENDPOINT" \
        -H "X-Amz-Target: AWSCognitoIdentityProviderService.AdminConfirmSignUp" \
        -H "Content-Type: application/x-amz-json-1.1" \
        -d "{
            \"UserPoolId\": \"$USER_POOL_ID\",
            \"Username\": \"$email\"
        }")
    
    echo "Confirm response: $CONFIRM_RESPONSE"
    echo "User $email created and confirmed"
    echo "----------------------------------------"
}

# Create pre-seeded users
create_user "demo@example.com" "Demo123!" "Demo User"
create_user "admin@example.com" "Admin123!" "Admin User"

echo "All pre-seeded users created successfully!"
echo "User Pool ID: $USER_POOL_ID"
echo "Client ID: $CLIENT_ID"
