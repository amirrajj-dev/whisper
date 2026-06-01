#!/bin/bash
# Test gateway/online status endpoints
# Requires: ACCESS_TOKEN_A, CURRENT_USER_ID (or OTHER_USER_ID) exported
#
# Usage:
#   ACCESS_TOKEN_A=xxx CURRENT_USER_ID=yyy ./src/scripts/test-gateway.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helper.sh"

GATEWAY_BASE="$API_BASE/gateway"
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

record_result() {
  if [[ $1 -eq 0 ]]; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
}

ACCESS_TOKEN="$ACCESS_TOKEN_A"
USER_ID="${CURRENT_USER_ID:-$OTHER_USER_ID}"

if [[ -z "$ACCESS_TOKEN" ]]; then
  print_fail "ACCESS_TOKEN_A is required. Run test-auth.sh first or export it."
  exit 1
fi

if [[ -z "$USER_ID" ]]; then
  print_fail "CURRENT_USER_ID or OTHER_USER_ID required. Run test-users.sh or export it."
  exit 1
fi

print_header "Gateway / Online Status Tests"

# ──────────────────────────────────────────────
# 1. GET /gateway/online/:userId
# ──────────────────────────────────────────────
print_step 1 "GET /gateway/online/:userId - Check online status"
ONLINE_RESP=$(curl -s -X GET "$GATEWAY_BASE/online/$USER_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

SUCCESS=$(json_val "$ONLINE_RESP" '.success // false')
ONLINE_STATUS=$(json_val "$ONLINE_RESP" '.data.online // empty')

if [[ "$SUCCESS" == "true" ]]; then
  record_result 0
  print_pass "Online check returned: online=${ONLINE_STATUS:-false}"
else
  record_result 1
  print_fail "Online check failed: $(json_val "$ONLINE_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 2. POST /gateway/online/batch
# ──────────────────────────────────────────────
print_step 2 "POST /gateway/online/batch - Batch online check"
BATCH_RESP=$(curl -s -X POST "$GATEWAY_BASE/online/batch" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userIds\":[\"$USER_ID\"]}")

BATCH_SUCCESS=$(json_val "$BATCH_RESP" '.success // false')
if [[ "$BATCH_SUCCESS" == "true" ]]; then
  record_result 0
  print_pass "Batch online check successful"
else
  record_result 1
  print_fail "Batch online check failed: $(json_val "$BATCH_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 3. GET /gateway/stats
# ──────────────────────────────────────────────
print_step 3 "GET /gateway/stats - Connection stats"
STATS_RESP=$(curl -s -X GET "$GATEWAY_BASE/stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

STATS_SUCCESS=$(json_val "$STATS_RESP" '.success // false')
if [[ "$STATS_SUCCESS" == "true" ]]; then
  record_result 0
  print_pass "Connection stats retrieved"
else
  record_result 1
  print_fail "Stats endpoint failed: $(json_val "$STATS_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 4. Unauthorized access (no token)
# ──────────────────────────────────────────────
print_step 4 "Unauthorized access to gateway"
UNAUTH_RESP=$(curl -s -X GET "$GATEWAY_BASE/stats")
UNAUTH_SUCCESS=$(json_val "$UNAUTH_RESP" '.success // false')
if [[ "$UNAUTH_SUCCESS" == "false" ]]; then
  record_result 0
  print_pass "Unauthorized gateway access blocked"
else
  record_result 1
  print_fail "Unauthorized gateway access was allowed"
fi

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
print_header "Gateway Test Summary"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $TESTS_SKIPPED${NC}"

exit $(( TESTS_FAILED > 0 ? 1 : 0 ))
