#!/bin/sh

# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 CHE3MZ (kaid)

# Build the kaid CLI for every release platform into dist/.
set -eu

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
DIST_DIR="$ROOT_DIR/dist"
BINARY_NAME="kaid"
PACKAGE="./cmd/kaid"

cd "$ROOT_DIR"

GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)
GIT_COMMIT=$(git rev-parse --short HEAD)
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VERSION=${VERSION:-${GIT_TAG:-v0.0.0-$GIT_COMMIT}}
LD_FLAGS="-s -w -X main.Version=$VERSION -X main.GitCommit=$GIT_COMMIT -X main.BuildDate=$BUILD_DATE"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

for target in linux/amd64 linux/arm64 darwin/amd64 darwin/arm64 windows/amd64 windows/arm64; do
	os=${target%/*}
	arch=${target#*/}
	ext=""
	[ "$os" = "windows" ] && ext=".exe"
	output="$DIST_DIR/$BINARY_NAME-$os-$arch$ext"
	printf 'building %s/%s -> %s\n' "$os" "$arch" "$output"
	GOOS="$os" GOARCH="$arch" CGO_ENABLED=0 go build -ldflags "$LD_FLAGS" -o "$output" "$PACKAGE"
done

cd "$DIST_DIR"
if command -v sha256sum >/dev/null 2>&1; then
	sha256sum "$BINARY_NAME"-* | sort > sha256sum.txt
elif command -v shasum >/dev/null 2>&1; then
	shasum -a 256 "$BINARY_NAME"-* | sort > sha256sum.txt
else
	printf 'error: sha256sum or shasum is required\n' >&2
	exit 1
fi
printf '%s\n' "$VERSION" > VERSION

printf '\nbuilt %s %s for 6 platforms\n' "$BINARY_NAME" "$VERSION"
