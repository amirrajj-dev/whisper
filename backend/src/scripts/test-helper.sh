#!/bin/bash
# Shared helper for all test scripts
# Usage: source src/scripts/test-helper.sh

API_BASE="${API_BASE:-http://localhost:3000/api}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# JSON value extractor using jq
json_val() {
  echo "$1" | jq -r "$2" 2>/dev/null
}

# Check if jq is available
if ! command -v jq &>/dev/null; then
  echo -e "${RED}Error: jq is required but not installed. Please install jq first.${NC}"
  exit 1
fi

# Print section header
print_header() {
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}========================================${NC}"
}

# Print test step
print_step() {
  echo -e "\n${BLUE}$1. $2...${NC}"
}

# Print success
print_pass() {
  echo -e "  ${GREEN}✓ $1${NC}"
}

# Print failure
print_fail() {
  echo -e "  ${RED}✗ $1${NC}"
}

# Print warning
print_warn() {
  echo -e "  ${YELLOW}⚠ $1${NC}"
}

# Check response success field
check_success() {
  local response="$1"
  local description="$2"
  local success
  success=$(json_val "$response" '.success // false')
  if [[ "$success" == "true" ]]; then
    print_pass "$description"
    return 0
  else
    local err_msg
    err_msg=$(json_val "$response" '.message // empty')
    print_fail "$description: $err_msg"
    return 1
  fi
}

# Check response contains expected text in the data
check_contains() {
  local response="$1"
  local key="$2"
  local expected="$3"
  local description="$4"
  local actual
  actual=$(echo "$response" | jq -r ".data.$key // empty" 2>/dev/null)
  if [[ "$actual" == "$expected" ]]; then
    print_pass "$description"
    return 0
  else
    print_fail "$description (expected: $expected, got: $actual)"
    return 1
  fi
}

# Check that response contains a non-null, non-empty value for a key
check_has_value() {
  local response="$1"
  local key="$2"
  local description="$3"
  local val
  val=$(echo "$response" | jq -r ".data.$key // \"\"" 2>/dev/null)
  if [[ -n "$val" && "$val" != "null" ]]; then
    print_pass "$description"
    return 0
  else
    print_fail "$description (missing or empty: .data.$key)"
    return 1
  fi
}

# Extract token from auth response (handles interceptor wrapper)
extract_token() {
  local response="$1"
  local token_type="$2"
  json_val "$response" ".data.$token_type // empty"
}

# Extract user _id from auth/user response
extract_user_id() {
  local response="$1"
  json_val "$response" '.data.user._id // .data._id // empty'
}

# Verify server is reachable
wait_for_server() {
  local max_retries="${1:-10}"
  local retry=0
  echo -n "Waiting for server at $API_BASE/health"
  while [[ $retry -lt $max_retries ]]; do
    if curl -s -f "$API_BASE/health" &>/dev/null; then
      echo -e " ${GREEN}up${NC}"
      return 0
    fi
    echo -n "."
    sleep 1
    ((retry++))
  done
  echo -e " ${RED}unreachable${NC}"
  print_fail "Server not reachable at $API_BASE. Is the app running?"
  return 1
}
