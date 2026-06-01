#!/bin/bash
# Test all user endpoints (profile, list, update, block/unblock)
# Requires: ACCESS_TOKEN_A exported (from run-all-tests.sh or manually)
#
# Usage:
#   ACCESS_TOKEN_A=xxx ./src/scripts/test-users.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helper.sh"

USERS_BASE="$API_BASE/users"
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

record_result() {
  if [[ $1 -eq 0 ]]; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
}

if [[ -z "$ACCESS_TOKEN_A" ]]; then
  print_warn "No ACCESS_TOKEN_A provided."
  print_warn "Run './src/scripts/run-all-tests.sh' or export ACCESS_TOKEN_A first."
  exit 1
fi

ACCESS_TOKEN="$ACCESS_TOKEN_A"
REFRESH_TOKEN="$REFRESH_TOKEN_A"

print_header "User Module Tests"

# ──────────────────────────────────────────────
# 1. GET /users (list users)
# ──────────────────────────────────────────────
print_step 1 "GET /users - List all users"
USERS_LIST_RESP=$(curl -s -X GET "$USERS_BASE" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

USERS_LIST=$(json_val "$USERS_LIST_RESP" '.data // []')
USERS_COUNT=$(echo "$USERS_LIST" | jq 'length' 2>/dev/null)
SUCCESS=$(json_val "$USERS_LIST_RESP" '.success // false')

if [[ "$SUCCESS" == "true" && "$USERS_COUNT" -ge 0 ]]; then
  record_result 0
  print_pass "Retrieved $USERS_COUNT users"
else
  record_result 1
  print_fail "Failed to list users: $(json_val "$USERS_LIST_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 2. GET /users/me
# ──────────────────────────────────────────────
print_step 2 "GET /users/me - Get current user"
ME_RESP=$(curl -s -X GET "$USERS_BASE/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

ME_ID=$(json_val "$ME_RESP" '.data._id // empty')
ME_USERNAME=$(json_val "$ME_RESP" '.data.username // empty')
if [[ -n "$ME_ID" && -n "$ME_USERNAME" ]]; then
  CURRENT_USER_ID="$ME_ID"
  record_result 0
  print_pass "Current user: $ME_USERNAME (ID: $ME_ID)"
else
  record_result 1
  print_fail "Failed to get current user: $(json_val "$ME_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 3. GET /users/:id (get user by ID)
# ──────────────────────────────────────────────
print_step 3 "GET /users/:id - Get user by ID"
if [[ -n "$CURRENT_USER_ID" ]]; then
  USER_BY_ID_RESP=$(curl -s -X GET "$USERS_BASE/$CURRENT_USER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  FETCHED_ID=$(json_val "$USER_BY_ID_RESP" '.data._id // empty')
  if [[ "$FETCHED_ID" == "$CURRENT_USER_ID" ]]; then
    record_result 0
    print_pass "User found by ID"
  else
    record_result 1
    print_fail "User ID mismatch or not found"
  fi
else
  record_result 1
  print_fail "Skipped: no user ID available"
fi

# ──────────────────────────────────────────────
# 4. PUT /users/me (update profile)
# ──────────────────────────────────────────────
print_step 4 "PUT /users/me - Update profile"
UPDATED_USERNAME="updated_$(date +%s)_user"
UPDATE_RESP=$(curl -s -X PUT "$USERS_BASE/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$UPDATED_USERNAME\",\"bio\":\"Updated via test script\"}")

UPDATE_USERNAME=$(json_val "$UPDATE_RESP" '.data.username // empty')
if [[ "$UPDATE_USERNAME" == "$UPDATED_USERNAME" ]]; then
  record_result 0
  print_pass "Profile updated successfully"
else
  record_result 1
  print_fail "Profile update failed: $(json_val "$UPDATE_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 5. POST /users/:userId/block (block a user)
# ──────────────────────────────────────────────
print_step 5 "POST /users/:userId/block - Block a user"
# If we have a second user from the env, use them; otherwise try listing users
TARGET_USER_ID=""
if [[ -n "$OTHER_USER_ID" ]]; then
  TARGET_USER_ID="$OTHER_USER_ID"
else
  # Grab the first user from the list that isn't current user
  TARGET_USER_ID=$(echo "$USERS_LIST" | jq -r ".[0]._id // empty" 2>/dev/null)
fi

if [[ -n "$TARGET_USER_ID" && "$TARGET_USER_ID" != "$CURRENT_USER_ID" ]]; then
  BLOCK_RESP=$(curl -s -X POST "$USERS_BASE/$TARGET_USER_ID/block" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  BLOCK_SUCCESS=$(json_val "$BLOCK_RESP" '.success // false')
  if [[ "$BLOCK_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "User blocked successfully"
  else
    record_result 1
    print_fail "Block failed: $(json_val "$BLOCK_RESP" '.message // empty')"
  fi

  # ──────────────────────────────────────────────
  # 6. DELETE /users/:userId/block (unblock user)
  # ──────────────────────────────────────────────
  print_step 6 "DELETE /users/:userId/block - Unblock user"
  UNBLOCK_RESP=$(curl -s -X DELETE "$USERS_BASE/$TARGET_USER_ID/block" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  UNBLOCK_SUCCESS=$(json_val "$UNBLOCK_RESP" '.success // false')
  if [[ "$UNBLOCK_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "User unblocked successfully"
  else
    record_result 1
    print_fail "Unblock failed: $(json_val "$UNBLOCK_RESP" '.message // empty')"
  fi
else
  print_warn "No other user available - skipping block/unblock tests"
  [[ -z "$TARGET_USER_ID" ]] && print_warn "  (could not find another user in list)"
  [[ "$TARGET_USER_ID" == "$CURRENT_USER_ID" ]] && print_warn "  (only self found in list)"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 2))
fi

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
print_header "User Test Summary"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $TESTS_SKIPPED${NC}"

export CURRENT_USER_ID

exit $(( TESTS_FAILED > 0 ? 1 : 0 ))
