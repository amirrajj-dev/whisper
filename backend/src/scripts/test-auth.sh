#!/bin/bash
# Test all auth endpoints (register, login, refresh, logout, token validation)
# Can run standalone or as part of run-all-tests.sh (reads ACCESS_TOKEN_A, REFRESH_TOKEN_A from env)
#
# Usage:
#   ./src/scripts/test-auth.sh                    # standalone (creates own user)
#   ACCESS_TOKEN_A=xxx REFRESH_TOKEN_A=xxx ./src/scripts/test-auth.sh  # use existing tokens

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helper.sh"

AUTH_BASE="$API_BASE/auth"
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

record_result() {
  if [[ $1 -eq 0 ]]; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
}

# Set up test user if not provided via env
if [[ -n "$ACCESS_TOKEN_A" && -n "$REFRESH_TOKEN_A" ]]; then
  USERNAME="$AUTH_TEST_USERNAME"
  EMAIL="$AUTH_TEST_EMAIL"
  PASSWORD="$AUTH_TEST_PASSWORD"
  ACCESS_TOKEN="$ACCESS_TOKEN_A"
  REFRESH_TOKEN="$REFRESH_TOKEN_A"
  print_header "Auth Tests (using provided tokens)"
else
  USERNAME="testuser_$(date +%s)"
  EMAIL="test_$(date +%s)@example.com"
  PASSWORD="Test@123456"
  print_header "Auth Tests (standalone)"
fi

# ──────────────────────────────────────────────
# 1. Register (skipped if tokens provided)
# ──────────────────────────────────────────────
if [[ -z "$ACCESS_TOKEN_A" ]]; then
print_step 1 "Register"
REGISTER_RESP=$(curl -s -X POST "$AUTH_BASE/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

ACCESS_TOKEN=$(extract_token "$REGISTER_RESP" "access_token")
REFRESH_TOKEN=$(extract_token "$REGISTER_RESP" "refresh_token")

if [[ -n "$ACCESS_TOKEN" && -n "$REFRESH_TOKEN" ]]; then
  record_result 0
  print_pass "Register successful"
else
  record_result 1
  print_fail "Register failed: $(json_val "$REGISTER_RESP" '.message // empty')"
  [[ -z "$ACCESS_TOKEN_A" ]] && exit 1
fi

# ──────────────────────────────────────────────
# 2. Duplicate register
# ──────────────────────────────────────────────
print_step 2 "Duplicate register"
DUPLICATE_RESP=$(curl -s -X POST "$AUTH_BASE/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

DUP_SUCCESS=$(json_val "$DUPLICATE_RESP" '.success // false')
if [[ "$DUP_SUCCESS" == "false" ]]; then
  record_result 0
  print_pass "Duplicate registration prevented"
else
  record_result 1
  print_fail "Duplicate registration was not rejected"
fi

# ──────────────────────────────────────────────
# 3. Login
# ──────────────────────────────────────────────
print_step 3 "Login"
LOGIN_RESP=$(curl -s -X POST "$AUTH_BASE/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

LOGIN_ACCESS=$(extract_token "$LOGIN_RESP" "access_token")
LOGIN_REFRESH=$(extract_token "$LOGIN_RESP" "refresh_token")
if [[ -n "$LOGIN_ACCESS" ]]; then
  ACCESS_TOKEN="$LOGIN_ACCESS"
  REFRESH_TOKEN="$LOGIN_REFRESH"
  record_result 0
  print_pass "Login successful"
else
  record_result 1
  print_fail "Login failed: $(json_val "$LOGIN_RESP" '.message // empty')"
fi
else
  print_step 1 "Register"
  print_warn "Skipped (using existing tokens)"
  print_step 2 "Duplicate register"
  print_warn "Skipped (using existing tokens)"
  print_step 3 "Login"
  print_warn "Skipped (using existing tokens)"
fi

# ──────────────────────────────────────────────
# 4. Login with wrong password
# ──────────────────────────────────────────────
print_step 4 "Login with wrong password"
WRONG_PASS_RESP=$(curl -s -X POST "$AUTH_BASE/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"WrongPass123!\"}")

WRONG_SUCCESS=$(json_val "$WRONG_PASS_RESP" '.success // false')
if [[ "$WRONG_SUCCESS" == "false" ]]; then
  record_result 0
  print_pass "Wrong password rejected"
else
  record_result 1
  print_fail "Wrong password was accepted"
fi

# ──────────────────────────────────────────────
# 5. GET /me (protected)
# ──────────────────────────────────────────────
print_step 5 "GET /auth/me"
ME_RESP=$(curl -s -X GET "$AUTH_BASE/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

ME_EMAIL=$(json_val "$ME_RESP" '.data.email // empty')
if [[ "$ME_EMAIL" == "$EMAIL" ]]; then
  record_result 0
  print_pass "Protected route accessible, correct user returned"
else
  record_result 1
  print_fail "Protected route failed: $(json_val "$ME_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 6. Unauthorized access (no token)
# ──────────────────────────────────────────────
print_step 6 "Unauthorized access"
UNAUTH_RESP=$(curl -s -X GET "$AUTH_BASE/me")
UNAUTH_SUCCESS=$(json_val "$UNAUTH_RESP" '.success // false')
UNAUTH_STATUS=$(json_val "$UNAUTH_RESP" '.statusCode // 200')
if [[ "$UNAUTH_SUCCESS" == "false" || "$UNAUTH_STATUS" == "401" ]]; then
  record_result 0
  print_pass "Unauthorized access blocked"
else
  record_result 1
  print_fail "Unauthorized request was not blocked"
fi

# ──────────────────────────────────────────────
# 7. Refresh token
# ──────────────────────────────────────────────
print_step 7 "Token refresh"
REFRESH_RESP=$(curl -s -X POST "$AUTH_BASE/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")

NEW_ACCESS=$(extract_token "$REFRESH_RESP" "access_token")
NEW_REFRESH=$(extract_token "$REFRESH_RESP" "refresh_token")
if [[ -n "$NEW_ACCESS" && -n "$NEW_REFRESH" ]]; then
  ACCESS_TOKEN="$NEW_ACCESS"
  REFRESH_TOKEN="$NEW_REFRESH"
  record_result 0
  print_pass "Token refresh successful"
else
  record_result 1
  print_fail "Token refresh failed: $(json_val "$REFRESH_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 8. Invalid refresh token
# ──────────────────────────────────────────────
print_step 8 "Invalid refresh token"
INVALID_REF_RESP=$(curl -s -X POST "$AUTH_BASE/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"invalid.token.here"}')

INVALID_REF_SUCCESS=$(json_val "$INVALID_REF_RESP" '.success // false')
if [[ "$INVALID_REF_SUCCESS" == "false" ]]; then
  record_result 0
  print_pass "Invalid refresh token rejected"
else
  record_result 1
  print_fail "Invalid refresh token was accepted"
fi

# ──────────────────────────────────────────────
# 9. Logout
# ──────────────────────────────────────────────
print_step 9 "Logout"
LOGOUT_RESP=$(curl -s -X POST "$AUTH_BASE/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

LOGOUT_SUCCESS=$(json_val "$LOGOUT_RESP" '.success // false')
if [[ "$LOGOUT_SUCCESS" == "true" ]]; then
  record_result 0
  print_pass "Logout successful"
else
  record_result 1
  print_fail "Logout failed: $(json_val "$LOGOUT_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 10. Access after logout (should fail)
# ──────────────────────────────────────────────
print_step 10 "Access after logout"
AFTER_LOGOUT_RESP=$(curl -s -X GET "$AUTH_BASE/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

AFTER_SUCCESS=$(json_val "$AFTER_LOGOUT_RESP" '.success // false')
AFTER_STATUS=$(json_val "$AFTER_LOGOUT_RESP" '.statusCode // 200')
if [[ "$AFTER_SUCCESS" == "false" || "$AFTER_STATUS" == "401" ]]; then
  record_result 0
  print_pass "Access blocked after logout"
else
  record_result 1
  print_fail "Still accessible after logout"
fi

# ──────────────────────────────────────────────
# 11. Invalid email format
# ──────────────────────────────────────────────
print_step 11 "Invalid email format"
INVALID_EMAIL_RESP=$(curl -s -X POST "$AUTH_BASE/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"not-an-email","password":"Test@123456"}')

INV_EMAIL_SUCCESS=$(json_val "$INVALID_EMAIL_RESP" '.success // false')
if [[ "$INV_EMAIL_SUCCESS" == "false" ]]; then
  record_result 0
  print_pass "Invalid email rejected"
else
  record_result 1
  print_fail "Invalid email was accepted"
fi

# ──────────────────────────────────────────────
# 12. Weak password
# ──────────────────────────────────────────────
print_step 12 "Weak password"
WEAK_PASS_RESP=$(curl -s -X POST "$AUTH_BASE/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"test2","email":"test2@example.com","password":"123"}')

WEAK_SUCCESS=$(json_val "$WEAK_PASS_RESP" '.success // false')
if [[ "$WEAK_SUCCESS" == "false" ]]; then
  record_result 0
  print_pass "Weak password rejected"
else
  record_result 1
  print_fail "Weak password was accepted"
fi

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
print_header "Auth Test Summary"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $TESTS_SKIPPED${NC}"

# Export tokens for downstream scripts
export ACCESS_TOKEN_A="$ACCESS_TOKEN"
export REFRESH_TOKEN_A="$REFRESH_TOKEN"
export AUTH_TEST_USERNAME="$USERNAME"
export AUTH_TEST_EMAIL="$EMAIL"
export AUTH_TEST_PASSWORD="$PASSWORD"

exit $(( TESTS_FAILED > 0 ? 1 : 0 ))
