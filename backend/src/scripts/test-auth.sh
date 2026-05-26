#!/bin/bash

BASE_URL="http://localhost:3000/api/auth"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Auth API Testing ===${NC}\n"

# Test data
USERNAME="testuser_$(date +%s)"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="Test@123456"

# 1. Register
echo -e "${BLUE}1. Testing Register...${NC}"
REGISTER_RESP=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if [[ $REGISTER_RESP == *"access_token"* ]]; then
  echo -e "${GREEN}✓ Register successful${NC}"
  ACCESS_TOKEN=$(echo $REGISTER_RESP | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo $REGISTER_RESP | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
else
  echo -e "${RED}✗ Register failed: $REGISTER_RESP${NC}"
  exit 1
fi

# 2. Duplicate register
echo -e "\n${BLUE}2. Testing Duplicate Register...${NC}"
DUPLICATE_REG=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if [[ $DUPLICATE_REG == *"already exists"* ]]; then
  echo -e "${GREEN}✓ Duplicate prevented${NC}"
else
  echo -e "${RED}✗ Duplicate not detected${NC}"
fi

# 3. Login
echo -e "\n${BLUE}3. Testing Login...${NC}"
LOGIN_RESP=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if [[ $LOGIN_RESP == *"access_token"* ]]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  ACCESS_TOKEN=$(echo $LOGIN_RESP | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo $LOGIN_RESP | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
else
  echo -e "${RED}✗ Login failed: $LOGIN_RESP${NC}"
fi

# 4. Wrong password
echo -e "\n${BLUE}4. Testing Wrong Password...${NC}"
WRONG_PASS=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"WrongPass123!\"}")

if [[ $WRONG_PASS == *"Invalid credentials"* ]]; then
  echo -e "${GREEN}✓ Wrong password rejected${NC}"
else
  echo -e "${RED}✗ Wrong password not detected${NC}"
fi

# 5. Get current user (protected)
echo -e "\n${BLUE}5. Testing GET /me...${NC}"
ME_RESP=$(curl -s -X GET $BASE_URL/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $ME_RESP == *"$EMAIL"* ]]; then
  echo -e "${GREEN}✓ Protected route accessible${NC}"
else
  echo -e "${RED}✗ Protected route failed${NC}"
fi

# 6. Unauthorized access
echo -e "\n${BLUE}6. Testing Unauthorized Access...${NC}"
UNAUTH_RESP=$(curl -s -X GET $BASE_URL/me)
if [[ $UNAUTH_RESP == *"401"* || $UNAUTH_RESP == *"Unauthorized"* ]]; then
  echo -e "${GREEN}✓ Unauthorized blocked${NC}"
else
  echo -e "${RED}✗ Unauthorized should be blocked${NC}"
fi

# 7. Refresh token
echo -e "\n${BLUE}7. Testing Refresh Token...${NC}"
REFRESH_RESP=$(curl -s -X POST $BASE_URL/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")

if [[ $REFRESH_RESP == *"access_token"* ]]; then
  echo -e "${GREEN}✓ Token refresh successful${NC}"
  NEW_ACCESS=$(echo $REFRESH_RESP | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
  echo -e "${RED}✗ Refresh failed${NC}"
fi

# 8. Invalid refresh token
echo -e "\n${BLUE}8. Testing Invalid Refresh Token...${NC}"
INVALID_REFRESH=$(curl -s -X POST $BASE_URL/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"invalid.token.here\"}")

if [[ $INVALID_REFRESH == *"Invalid"* ]]; then
  echo -e "${GREEN}✓ Invalid token rejected${NC}"
else
  echo -e "${RED}✗ Invalid token accepted${NC}"
fi

# 9. Logout
echo -e "\n${BLUE}9. Testing Logout...${NC}"
LOGOUT_RESP=$(curl -s -X POST $BASE_URL/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $LOGOUT_RESP == *"success"* ]]; then
  echo -e "${GREEN}✓ Logout successful${NC}"
else
  echo -e "${RED}✗ Logout failed${NC}"
fi

# 10. Verify logout (should fail)
echo -e "\n${BLUE}10. Testing Access After Logout...${NC}"
AFTER_LOGOUT=$(curl -s -X GET $BASE_URL/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [[ $AFTER_LOGOUT == *"401"* || $AFTER_LOGOUT == *"Unauthorized"* ]]; then
  echo -e "${GREEN}✓ Cannot access after logout${NC}"
else
  echo -e "${RED}✗ Still accessible after logout${NC}"
fi

# 11. Invalid email format
echo -e "\n${BLUE}11. Testing Invalid Email Format...${NC}"
INVALID_EMAIL=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test\",\"email\":\"invalid-email\",\"password\":\"Test@123456\"}")

if [[ $INVALID_EMAIL == *"email"* || $INVALID_EMAIL == *"validation"* ]]; then
  echo -e "${GREEN}✓ Invalid email rejected${NC}"
else
  echo -e "${RED}✗ Invalid email accepted${NC}"
fi

# 12. Weak password
echo -e "\n${BLUE}12. Testing Weak Password...${NC}"
WEAK_PASS=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test2\",\"email\":\"test2@example.com\",\"password\":\"123\"}")

if [[ $WEAK_PASS == *"password"* ]]; then
  echo -e "${GREEN}✓ Weak password rejected${NC}"
else
  echo -e "${RED}✗ Weak password accepted${NC}"
fi

echo -e "\n${GREEN}=== Testing Complete ===${NC}"