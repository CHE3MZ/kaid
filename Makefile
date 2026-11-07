.PHONY: test coverage clean run help fmt vet check \
	license-check license-add english-check

GO       := go
DIST_DIR := ./dist
LOG_DIR  := ./logs

# The standalone frontend has no Go packages.
PACKAGES := ./...

test:
	LC_ALL=C $(GO) test -v -race -count=1 $(PACKAGES)

coverage:
	sh scripts/ops/coverage.sh

clean:
	rm -rf $(DIST_DIR)
	rm -rf $(LOG_DIR)

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
