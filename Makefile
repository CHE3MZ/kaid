.PHONY: test clean run help fmt vet check coverage \
	license-check license-add english-check

GO       := go
DIST_DIR := ./dist

# The standalone frontend has no Go packages.
PACKAGES := ./...

test:
	LC_ALL=C $(GO) test -v -race -count=1 $(PACKAGES)

COVERAGE_THRESHOLD := 90

coverage:
	LC_ALL=C $(GO) test -count=1 -coverprofile=coverage.out $(PACKAGES)
	$(GO) tool cover -func=coverage.out | grep total:
	@COVERAGE=$$($(GO) tool cover -func=coverage.out | grep total: | awk '{print $$3}' | sed 's/%//'); \
	if awk "BEGIN {exit !($$COVERAGE < $(COVERAGE_THRESHOLD))}"; then \
		echo "FAIL: Coverage $${COVERAGE}% is below $(COVERAGE_THRESHOLD)% threshold"; \
		exit 1; \
	fi; \
	echo "PASS: Coverage $${COVERAGE}% meets $(COVERAGE_THRESHOLD)% threshold"

clean:
	rm -rf $(DIST_DIR) coverage.out

run:
	$(GO) run ./cmd/opencodereview --staged

help:
	$(GO) run ./cmd/opencodereview -h

fmt:
	gofmt -s -w .

vet:
	LC_ALL=C $(GO) vet $(PACKAGES)

check: license-check english-check
	$(GO) mod tidy
	gofmt -s -w .
	LC_ALL=C $(GO) vet $(PACKAGES)
	@echo "check passed"

license-check:
	@bash scripts/verify-license.sh

english-check:
	@$(GO) run scripts/verify-english-only.go

license-add:
	@bash scripts/add-license.sh
