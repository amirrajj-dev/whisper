#!/bin/bash
# End-to-end test orchestrator
# Registers two users, then runs all module tests in sequence
#
# Usage:
#   ./src/scripts/run-all-tests.sh                    # full suite
#   ./src/scripts/run-all-tests.sh --skip-auth        # skip auth test
#   ./src/scripts/run-all-tests.sh --module chat      # run only chat test
#
# Options:
#   --skip-auth       Skip auth tests (use existing tokens from env)
#   --module <name>   Run only a specific module (auth, users, chat, notifications, gateway)
#   --no-cleanup      Keep test users after run
#   --help            Show usage

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test-helper.sh"

ALL_MODULES=("auth" "users" "chat" "notifications" "gateway")
MODULES_TO_RUN=()
SKIP_AUTH=false
CLEANUP=true

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-auth) SKIP_AUTH=true; shift ;;
    --no-cleanup) CLEANUP=false; shift ;;
    --module)
      shift
      if [[ -n "$1" ]]; then
        MODULES_TO_RUN+=("$1")
        shift
      fi
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo "  --skip-auth       Skip auth tests (use existing tokens from env)"
      echo "  --module <name>   Run only specific module (auth, users, chat, notifications, gateway)"
      echo "  --no-cleanup      Keep test users after run"
      echo "  --help            Show this help"
      exit 0
      ;;
    *)
      print_fail "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ ${#MODULES_TO_RUN[@]} -eq 0 ]]; then
  MODULES_TO_RUN=("${ALL_MODULES[@]}")
fi

OVERALL_PASSED=0
OVERALL_FAILED=0
OVERALL_SKIPPED=0

# ──────────────────────────────────────────────
# Setup: Register two test users
# ──────────────────────────────────────────────
print_header "End-to-End Test Suite"
echo "Started at: $(date)"
echo "Server:     $API_BASE"

wait_for_server || exit 1

# Register user A
print_step "Setup" "Registering User A"
TS=$(date +%s)
USER_A_USERNAME="e2e_user_a_${TS}"
USER_A_EMAIL="e2e_a_${TS}@gmail.com"
USER_A_PASS="Test@123456"

REG_A_RESP=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER_A_USERNAME\",\"email\":\"$USER_A_EMAIL\",\"password\":\"$USER_A_PASS\"}")

ACCESS_TOKEN_A=$(extract_token "$REG_A_RESP" "access_token")
REFRESH_TOKEN_A=$(extract_token "$REG_A_RESP" "refresh_token")
USER_A_ID=$(extract_user_id "$REG_A_RESP")

if [[ -z "$ACCESS_TOKEN_A" ]]; then
  print_fail "Failed to register User A: $(json_val "$REG_A_RESP" '.message // empty')"
  exit 1
fi
print_pass "User A: $USER_A_USERNAME (ID: $USER_A_ID)"

# Register user B
print_step "Setup" "Registering User B"
USER_B_USERNAME="e2e_user_b_${TS}"
USER_B_EMAIL="e2e_b_${TS}@gmail.com"
USER_B_PASS="Test@123456"

REG_B_RESP=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER_B_USERNAME\",\"email\":\"$USER_B_EMAIL\",\"password\":\"$USER_B_PASS\"}")

ACCESS_TOKEN_B=$(extract_token "$REG_B_RESP" "access_token")
REFRESH_TOKEN_B=$(extract_token "$REG_B_RESP" "refresh_token")
USER_B_ID=$(extract_user_id "$REG_B_RESP")

if [[ -z "$ACCESS_TOKEN_B" ]]; then
  print_fail "Failed to register User B: $(json_val "$REG_B_RESP" '.message // empty')"
  exit 1
fi
print_pass "User B: $USER_B_USERNAME (ID: $USER_B_ID)"

# Export shared vars for module scripts
export ACCESS_TOKEN_A
export REFRESH_TOKEN_A
export ACCESS_TOKEN_B
export REFRESH_TOKEN_B
export OTHER_USER_ID="$USER_B_ID"
export CURRENT_USER_ID="$USER_A_ID"
export AUTH_TEST_USERNAME="$USER_A_USERNAME"
export AUTH_TEST_EMAIL="$USER_A_EMAIL"
export AUTH_TEST_PASSWORD="$USER_A_PASS"

echo ""

# ──────────────────────────────────────────────
# Run module tests
# ──────────────────────────────────────────────
run_module() {
  local name="$1"
  local script="$2"
  local skip_env="$3"

  if [[ "$SKIP_AUTH" == true && "$name" == "auth" ]]; then
    print_warn "Skipping $name tests (--skip-auth)"
    OVERALL_SKIPPED=$((OVERALL_SKIPPED + 1))
    return 0
  fi

  if [[ "$skip_env" == "true" && -z "$ACCESS_TOKEN_A" ]]; then
    print_warn "Skipping $name tests (no token available)"
    OVERALL_SKIPPED=$((OVERALL_SKIPPED + 1))
    return 0
  fi

  print_header "$(echo $name | tr '[:lower:]' '[:upper:]') Tests"

  if [[ ! -f "$script" ]]; then
    print_fail "Script not found: $script"
    OVERALL_FAILED=$((OVERALL_FAILED + 1))
    return 1
  fi

  bash "$script"
  local exit_code=$?

  if [[ $exit_code -eq 0 ]]; then
    OVERALL_PASSED=$((OVERALL_PASSED + 1))
  else
    OVERALL_FAILED=$((OVERALL_FAILED + 1))
  fi
  return $exit_code
}

for module in "${MODULES_TO_RUN[@]}"; do
  case "$module" in
    auth)
      run_module "auth" "$SCRIPT_DIR/test-auth.sh" "false"
      ;;
    users)
      run_module "users" "$SCRIPT_DIR/test-users.sh" "true"
      ;;
    chat)
      run_module "chat" "$SCRIPT_DIR/test-chat.sh" "true"
      ;;
    notifications)
      run_module "notifications" "$SCRIPT_DIR/test-notifications.sh" "true"
      ;;
    gateway)
      run_module "gateway" "$SCRIPT_DIR/test-gateway.sh" "true"
      ;;
    *)
      print_fail "Unknown module: $module"
      ;;
  esac
done

# ──────────────────────────────────────────────
# Cleanup (optional)
# ──────────────────────────────────────────────
if [[ "$CLEANUP" == true && -n "$ACCESS_TOKEN_A" && -n "$ACCESS_TOKEN_B" ]]; then
  print_header "Cleanup"
  # Logout both users to invalidate their tokens
  LOGOUT_A=$(curl -s -X POST "$API_BASE/auth/logout" \
    -H "Authorization: Bearer $ACCESS_TOKEN_A")
  LOGOUT_B=$(curl -s -X POST "$API_BASE/auth/logout" \
    -H "Authorization: Bearer $ACCESS_TOKEN_B")
  print_pass "Test users logged out"
fi

# ──────────────────────────────────────────────
# Final Summary
# ──────────────────────────────────────────────
print_header "Final Summary"
echo -e "  Started at: $(date)"
echo -e "  Server:     $API_BASE"
echo ""
echo -e "  ${GREEN}Modules passed: $OVERALL_PASSED${NC}"
echo -e "  ${RED}Modules failed: $OVERALL_FAILED${NC}"
echo -e "  ${YELLOW}Modules skipped: $OVERALL_SKIPPED${NC}"

TOTAL_MODULES=$((OVERALL_PASSED + OVERALL_FAILED + OVERALL_SKIPPED))
echo -e "  Total modules:  $TOTAL_MODULES"

if [[ "$OVERALL_FAILED" -gt 0 ]]; then
  echo -e "\n  ${RED}Some tests failed!${NC}"
  exit 1
else
  echo -e "\n  ${GREEN}All tests passed!${NC}"
  exit 0
fi
