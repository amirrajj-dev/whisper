#!/bin/bash
# Test all notification endpoints (list, unread count, mark read, delete)
# Requires: ACCESS_TOKEN_A exported
#
# Usage:
#   ACCESS_TOKEN_A=xxx ./src/scripts/test-notifications.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helper.sh"

NOTIF_BASE="$API_BASE/notification"
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

record_result() {
  if [[ $1 -eq 0 ]]; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
}

ACCESS_TOKEN="$ACCESS_TOKEN_A"

if [[ -z "$ACCESS_TOKEN" ]]; then
  print_fail "ACCESS_TOKEN_A is required. Run test-auth.sh first or export it."
  exit 1
fi

print_header "Notification Module Tests"

NOTIFICATION_ID=""

# ──────────────────────────────────────────────
# 1. GET /notification - List notifications
# ──────────────────────────────────────────────
print_step 1 "GET /notification - List notifications"
LIST_RESP=$(curl -s -X GET "$NOTIF_BASE" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

SUCCESS=$(json_val "$LIST_RESP" '.success // false')
NOTIF_LIST=$(json_val "$LIST_RESP" '.data // []')
NOTIF_COUNT=$(echo "$NOTIF_LIST" | jq 'length' 2>/dev/null)

if [[ "$SUCCESS" == "true" && "$NOTIF_COUNT" -ge 0 ]]; then
  record_result 0
  print_pass "Retrieved $NOTIF_COUNT notification(s)"
  # Grab the first notification ID for later tests
  NOTIFICATION_ID=$(echo "$NOTIF_LIST" | jq -r '.[0]._id // empty' 2>/dev/null)
else
  record_result 1
  print_fail "List notifications failed: $(json_val "$LIST_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 2. GET /notification/unread-count
# ──────────────────────────────────────────────
print_step 2 "GET /notification/unread-count"
UNREAD_RESP=$(curl -s -X GET "$NOTIF_BASE/unread-count" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

UNREAD_COUNT=$(json_val "$UNREAD_RESP" '.data.count // .data.unreadCount // empty')
SUCCESS=$(json_val "$UNREAD_RESP" '.success // false')

if [[ "$SUCCESS" == "true" ]]; then
  record_result 0
  print_pass "Unread count: ${UNREAD_COUNT:-retrieved}"
else
  record_result 1
  print_fail "Get unread count failed: $(json_val "$UNREAD_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 3. PATCH /notification/:id/read - Mark one as read
# ──────────────────────────────────────────────
print_step 3 "PATCH /notification/:id/read - Mark notification as read"
if [[ -n "$NOTIFICATION_ID" ]]; then
  MARK_READ_RESP=$(curl -s -X PATCH "$NOTIF_BASE/$NOTIFICATION_ID/read" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  READ_SUCCESS=$(json_val "$MARK_READ_RESP" '.success // false')
  if [[ "$READ_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "Notification marked as read"
  else
    record_result 1
    print_fail "Mark as read failed: $(json_val "$MARK_READ_RESP" '.message // empty')"
  fi
else
  print_warn "No notifications to mark as read"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
fi

# ──────────────────────────────────────────────
# 4. PATCH /notification/read-all - Mark all as read
# ──────────────────────────────────────────────
print_step 4 "PATCH /notification/read-all - Mark all as read"
MARK_ALL_RESP=$(curl -s -X PATCH "$NOTIF_BASE/read-all" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

ALL_READ_SUCCESS=$(json_val "$MARK_ALL_RESP" '.success // false')
if [[ "$ALL_READ_SUCCESS" == "true" ]]; then
  record_result 0
  print_pass "All notifications marked as read"
else
  record_result 1
  print_fail "Mark all as read failed: $(json_val "$MARK_ALL_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 5. DELETE /notification/:id - Delete notification
# ──────────────────────────────────────────────
print_step 5 "DELETE /notification/:id - Delete notification"
if [[ -n "$NOTIFICATION_ID" ]]; then
  DEL_NOTIF_RESP=$(curl -s -X DELETE "$NOTIF_BASE/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  DEL_SUCCESS=$(json_val "$DEL_NOTIF_RESP" '.success // false')
  if [[ "$DEL_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "Notification deleted"
  else
    record_result 1
    print_fail "Delete notification failed: $(json_val "$DEL_NOTIF_RESP" '.message // empty')"
  fi
else
  print_warn "No notification to delete"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
fi

# ──────────────────────────────────────────────
# 6. GET /notification with pagination params
# ──────────────────────────────────────────────
print_step 6 "GET /notification?page=1&limit=5 - Paginated"
PAG_RESP=$(curl -s -X GET "$NOTIF_BASE?page=1&limit=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

PAG_SUCCESS=$(json_val "$PAG_RESP" '.success // false')
if [[ "$PAG_SUCCESS" == "true" ]]; then
  record_result 0
  print_pass "Paginated notifications retrieved"
else
  record_result 1
  print_fail "Paginated list failed: $(json_val "$PAG_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
print_header "Notification Test Summary"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $TESTS_SKIPPED${NC}"

exit $(( TESTS_FAILED > 0 ? 1 : 0 ))
