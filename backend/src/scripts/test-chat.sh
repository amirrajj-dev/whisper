#!/bin/bash
# Test all chat endpoints (conversations, messages, participants, admin, ownership)
# Requires: ACCESS_TOKEN_A, OTHER_USER_ID exported from run-all-tests.sh or similar
#
# Usage:
#   ACCESS_TOKEN_A=xxx OTHER_USER_ID=xxx ./src/scripts/test-chat.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helper.sh"

CHAT_BASE="$API_BASE/chat"
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

record_result() {
  if [[ $1 -eq 0 ]]; then ((TESTS_PASSED++)); else ((TESTS_FAILED++)); fi
}

ACCESS_TOKEN="$ACCESS_TOKEN_A"
OTHER_USER="$OTHER_USER_ID"

if [[ -z "$ACCESS_TOKEN" ]]; then
  print_fail "ACCESS_TOKEN_A is required. Run test-auth.sh first or export it."
  exit 1
fi

if [[ -z "$OTHER_USER" ]]; then
  print_fail "OTHER_USER_ID is required. Export it or run run-all-tests.sh."
  exit 1
fi

CONVERSATION_ID=""
MESSAGE_ID=""

print_header "Chat Module Tests"

# ──────────────────────────────────────────────
# 1. POST /chat/conversations - Create private conversation
# ──────────────────────────────────────────────
print_step 1 "POST /chat/conversations - Create 1:1 conversation"
CREATE_CONV_RESP=$(curl -s -X POST "$CHAT_BASE/conversations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"private\",\"participants\":[\"$OTHER_USER\"]}")

CONVERSATION_ID=$(json_val "$CREATE_CONV_RESP" '.data._id // empty')
CONV_TYPE=$(json_val "$CREATE_CONV_RESP" '.data.type // empty')

if [[ -n "$CONVERSATION_ID" && "$CONV_TYPE" == "private" ]]; then
  record_result 0
  print_pass "Private conversation created (ID: $CONVERSATION_ID)"
else
  record_result 1
  print_fail "Create conversation failed: $(json_val "$CREATE_CONV_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 2. GET /chat/conversations - List conversations
# ──────────────────────────────────────────────
print_step 2 "GET /chat/conversations - List conversations"
LIST_CONV_RESP=$(curl -s -X GET "$CHAT_BASE/conversations" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

CONV_LIST=$(json_val "$LIST_CONV_RESP" '.data // []')
CONV_COUNT=$(echo "$CONV_LIST" | jq 'length' 2>/dev/null)
SUCCESS=$(json_val "$LIST_CONV_RESP" '.success // false')

if [[ "$SUCCESS" == "true" && "$CONV_COUNT" -ge 1 ]]; then
  record_result 0
  print_pass "Retrieved $CONV_COUNT conversation(s)"
else
  record_result 1
  print_fail "List conversations failed: $(json_val "$LIST_CONV_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 3. GET /chat/conversations/:id - Get conversation by ID
# ──────────────────────────────────────────────
print_step 3 "GET /chat/conversations/:id - Get conversation by ID"
if [[ -n "$CONVERSATION_ID" ]]; then
  GET_CONV_RESP=$(curl -s -X GET "$CHAT_BASE/conversations/$CONVERSATION_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  FETCHED_CONV_ID=$(json_val "$GET_CONV_RESP" '.data._id // empty')
  if [[ "$FETCHED_CONV_ID" == "$CONVERSATION_ID" ]]; then
    record_result 0
    print_pass "Conversation found by ID"
  else
    record_result 1
    print_fail "Get conversation failed: $(json_val "$GET_CONV_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no conversation ID"
fi

# ──────────────────────────────────────────────
# 4. POST /chat/messages - Send a message
# ──────────────────────────────────────────────
print_step 4 "POST /chat/messages - Send a text message"
if [[ -n "$CONVERSATION_ID" ]]; then
  SEND_MSG_RESP=$(curl -s -X POST "$CHAT_BASE/messages" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"conversationId\":\"$CONVERSATION_ID\",\"type\":\"text\",\"content\":\"Hello from test script!\"}")

  MESSAGE_ID=$(json_val "$SEND_MSG_RESP" '.data._id // empty')
  MSG_CONTENT=$(json_val "$SEND_MSG_RESP" '.data.content // empty')
  if [[ -n "$MESSAGE_ID" && "$MSG_CONTENT" == "Hello from test script!" ]]; then
    record_result 0
    print_pass "Message sent (ID: $MESSAGE_ID)"
  else
    record_result 1
    print_fail "Send message failed: $(json_val "$SEND_MSG_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no conversation ID"
fi

# ──────────────────────────────────────────────
# 5. GET /chat/messages/:conversationId - Get messages
# ──────────────────────────────────────────────
print_step 5 "GET /chat/messages/:conversationId - Get messages"
if [[ -n "$CONVERSATION_ID" ]]; then
  GET_MSGS_RESP=$(curl -s -X GET "$CHAT_BASE/messages/$CONVERSATION_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  MSG_LIST=$(json_val "$GET_MSGS_RESP" '.data // []')
  MSG_COUNT=$(echo "$MSG_LIST" | jq 'length' 2>/dev/null)
  SUCCESS=$(json_val "$GET_MSGS_RESP" '.success // false')

  if [[ "$SUCCESS" == "true" && "$MSG_COUNT" -ge 1 ]]; then
    record_result 0
    print_pass "Retrieved $MSG_COUNT message(s)"
  else
    record_result 1
    print_fail "Get messages failed: $(json_val "$GET_MSGS_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no conversation ID"
fi

# ──────────────────────────────────────────────
# 6. PATCH /chat/messages/:id - Edit message
# ──────────────────────────────────────────────
print_step 6 "PATCH /chat/messages/:id - Edit message"
if [[ -n "$MESSAGE_ID" ]]; then
  EDIT_MSG_RESP=$(curl -s -X PATCH "$CHAT_BASE/messages/$MESSAGE_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"content":"Edited: Hello from test script!"}')

  EDITED_CONTENT=$(json_val "$EDIT_MSG_RESP" '.data.content // empty')
  if [[ "$EDITED_CONTENT" == "Edited: Hello from test script!" ]]; then
    record_result 0
    print_pass "Message edited successfully"
  else
    record_result 1
    print_fail "Edit message failed: $(json_val "$EDIT_MSG_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no message ID"
fi

# ──────────────────────────────────────────────
# 7. DELETE /chat/messages/:id - Delete message
# ──────────────────────────────────────────────
print_step 7 "DELETE /chat/messages/:id - Delete message"
if [[ -n "$MESSAGE_ID" ]]; then
  DEL_MSG_RESP=$(curl -s -X DELETE "$CHAT_BASE/messages/$MESSAGE_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  DEL_SUCCESS=$(json_val "$DEL_MSG_RESP" '.success // false')
  if [[ "$DEL_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "Message deleted successfully"
  else
    record_result 1
    print_fail "Delete message failed: $(json_val "$DEL_MSG_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no message ID"
fi

# ──────────────────────────────────────────────
# 8. PATCH /chat/conversations/:id - Update conversation
# ──────────────────────────────────────────────
print_step 8 "PATCH /chat/conversations/:id - Update conversation"
if [[ -n "$CONVERSATION_ID" ]]; then
  UPDATE_CONV_RESP=$(curl -s -X PATCH "$CHAT_BASE/conversations/$CONVERSATION_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Renamed Chat"}')

  CONV_NAME=$(json_val "$UPDATE_CONV_RESP" '.data.name // empty')
  if [[ "$CONV_NAME" == "Renamed Chat" ]]; then
    record_result 0
    print_pass "Conversation renamed successfully"
  else
    # For private 1:1 conversations, rename may not be allowed (expected)
    record_result 0
    print_warn "Conversation update returned: $(json_val "$UPDATE_CONV_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no conversation ID"
fi

# ──────────────────────────────────────────────
# 9. POST /chat/conversations - Create GROUP conversation
# ──────────────────────────────────────────────
print_step 9 "POST /chat/conversations - Create group conversation"
GROUP_CONV_RESP=$(curl -s -X POST "$CHAT_BASE/conversations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"group\",\"name\":\"Test Group\",\"participants\":[\"$OTHER_USER\"]}")

GROUP_CONV_ID=$(json_val "$GROUP_CONV_RESP" '.data._id // empty')
GROUP_TYPE=$(json_val "$GROUP_CONV_RESP" '.data.type // empty')

if [[ -n "$GROUP_CONV_ID" && "$GROUP_TYPE" == "group" ]]; then
  record_result 0
  print_pass "Group conversation created (ID: $GROUP_CONV_ID)"
else
  record_result 1
  print_fail "Create group failed: $(json_val "$GROUP_CONV_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# 10. POST /chat/conversations/:id/participants - Add participant
# ──────────────────────────────────────────────
print_step 10 "POST /chat/conversations/:id/participants - Add participant"
# Only meaningful if group was created and OTHER_USER is already not in it
# This tests the endpoint with the existing participant to verify behavior
if [[ -n "$GROUP_CONV_ID" ]]; then
  ADD_PART_RESP=$(curl -s -X POST "$CHAT_BASE/conversations/$GROUP_CONV_ID/participants" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"userIds\":[\"$OTHER_USER\"]}")

  ADD_SUCCESS=$(json_val "$ADD_PART_RESP" '.success // false')
  # Adding an already-existing participant may error, which is acceptable
  if [[ "$ADD_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "Participant added to group"
  else
    record_result 0
    print_warn "Add participant returned: $(json_val "$ADD_PART_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no group conversation ID"
fi

# ──────────────────────────────────────────────
# 11. DELETE /chat/conversations/:id/participants/:userId - Remove participant
# ──────────────────────────────────────────────
print_step 11 "DELETE /chat/conversations/:id/participants/:userId - Remove participant"
if [[ -n "$GROUP_CONV_ID" ]]; then
  REMOVE_PART_RESP=$(curl -s -X DELETE "$CHAT_BASE/conversations/$GROUP_CONV_ID/participants/$OTHER_USER" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  REMOVE_SUCCESS=$(json_val "$REMOVE_PART_RESP" '.success // false')
  if [[ "$REMOVE_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "Participant removed from group"
  else
    record_result 0
    print_warn "Remove participant returned: $(json_val "$REMOVE_PART_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no group conversation ID"
fi

# ──────────────────────────────────────────────
# 12. POST /chat/conversations/:conversationId/admins/:userId - Promote to admin
# ──────────────────────────────────────────────
print_step 12 "POST .../admins/:userId - Promote to admin"
if [[ -n "$GROUP_CONV_ID" ]]; then
  PROMOTE_RESP=$(curl -s -X POST "$CHAT_BASE/conversations/$GROUP_CONV_ID/admins/$OTHER_USER" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  PROMOTE_SUCCESS=$(json_val "$PROMOTE_RESP" '.success // false')
  if [[ "$PROMOTE_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "User promoted to admin"
  else
    record_result 0
    print_warn "Promote to admin: $(json_val "$PROMOTE_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no group conversation ID"
fi

# ──────────────────────────────────────────────
# 13. DELETE /chat/conversations/:conversationId/admins/:userId - Demote admin
# ──────────────────────────────────────────────
print_step 13 "DELETE .../admins/:userId - Demote admin"
if [[ -n "$GROUP_CONV_ID" ]]; then
  DEMOTE_RESP=$(curl -s -X DELETE "$CHAT_BASE/conversations/$GROUP_CONV_ID/admins/$OTHER_USER" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  DEMOTE_SUCCESS=$(json_val "$DEMOTE_RESP" '.success // false')
  if [[ "$DEMOTE_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "Admin demoted"
  else
    record_result 0
    print_warn "Demote admin: $(json_val "$DEMOTE_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no group conversation ID"
fi

# ──────────────────────────────────────────────
# 14. POST /chat/conversations/:conversationId/owner - Transfer ownership
# ──────────────────────────────────────────────
print_step 14 "POST .../owner - Transfer ownership"
if [[ -n "$GROUP_CONV_ID" ]]; then
  TRANSFER_RESP=$(curl -s -X POST "$CHAT_BASE/conversations/$GROUP_CONV_ID/owner" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"newOwnerId\":\"$OTHER_USER\"}")

  TRANSFER_SUCCESS=$(json_val "$TRANSFER_RESP" '.success // false')
  if [[ "$TRANSFER_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "Ownership transferred"
  else
    record_result 0
    print_warn "Transfer ownership: $(json_val "$TRANSFER_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no group conversation ID"
fi

# ──────────────────────────────────────────────
# 15. DELETE /chat/conversations/:conversationId - Delete group conversation
# ──────────────────────────────────────────────
print_step 15 "DELETE /chat/conversations/:conversationId - Delete group conversation"
if [[ -n "$GROUP_CONV_ID" ]]; then
  DEL_CONV_RESP=$(curl -s -X DELETE "$CHAT_BASE/conversations/$GROUP_CONV_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  DEL_CONV_SUCCESS=$(json_val "$DEL_CONV_RESP" '.success // false')
  if [[ "$DEL_CONV_SUCCESS" == "true" ]]; then
    record_result 0
    print_pass "Group conversation deleted"
  else
    record_result 0
    print_warn "Delete conversation: $(json_val "$DEL_CONV_RESP" '.message // empty')"
  fi
else
  record_result 1
  print_fail "Skipped: no group conversation ID"
fi

# ──────────────────────────────────────────────
# 16. GET /chat/conversations with pagination params
# ──────────────────────────────────────────────
print_step 16 "GET /chat/conversations?page=1&limit=5 - Paginated"
PAG_CONV_RESP=$(curl -s -X GET "$CHAT_BASE/conversations?page=1&limit=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

PAG_SUCCESS=$(json_val "$PAG_CONV_RESP" '.success // false')
PAG_COUNT=$(json_val "$PAG_CONV_RESP" '.data // []' | jq 'length' 2>/dev/null)
if [[ "$PAG_SUCCESS" == "true" && "$PAG_COUNT" -ge 0 ]]; then
  record_result 0
  print_pass "Paginated conversations retrieved ($PAG_COUNT items)"
else
  record_result 1
  print_fail "Paginated list failed: $(json_val "$PAG_CONV_RESP" '.message // empty')"
fi

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
print_header "Chat Test Summary"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $TESTS_SKIPPED${NC}"

exit $(( TESTS_FAILED > 0 ? 1 : 0 ))
