#!/bin/sh

# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 CHE3MZ (kaid)

# Run the Go tests with coverage and enforce a minimum total.
set -eu

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
LOGS_DIR="$ROOT_DIR/logs"
PROFILE="$LOGS_DIR/coverage.out"
REPORT="$LOGS_DIR/coverage.html"
GO=${GO:-go}
THRESHOLD=${COVERAGE_THRESHOLD:-90}

cd "$ROOT_DIR"
mkdir -p "$LOGS_DIR"

LC_ALL=C "$GO" test -count=1 -coverprofile="$PROFILE" ./...

SUMMARY=$("$GO" tool cover -func="$PROFILE")
printf '%s\n' "$SUMMARY" | grep '^total:'
TOTAL=$(printf '%s\n' "$SUMMARY" | awk '/^total:/ {gsub(/%/, "", $3); print $3}')
[ -n "$TOTAL" ] || {
	printf 'error: could not read total coverage\n' >&2
	exit 1
}

"$GO" tool cover -html="$PROFILE" -o "$REPORT"

printf 'coverage profile: %s\n' "${PROFILE#"$ROOT_DIR"/}"
printf 'coverage report:  %s\n' "${REPORT#"$ROOT_DIR"/}"

if awk "BEGIN {exit !($TOTAL < $THRESHOLD)}"; then
	printf 'FAIL: coverage %s%% is below %s%% threshold\n' "$TOTAL" "$THRESHOLD" >&2
	exit 1
fi
printf 'PASS: coverage %s%% meets %s%% threshold\n' "$TOTAL" "$THRESHOLD"
