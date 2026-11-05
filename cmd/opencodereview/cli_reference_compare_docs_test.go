// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCLIReferenceDocumentsSessionCompare(t *testing.T) {
	path := filepath.Join("..", "..", "pages", "src", "content", "docs", "en", "cli-reference.md")
	body, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	for _, want := range []string{
		"`ocr session compare <before> <after>`", // command-summary table row
		"### `ocr session compare`",              // reference section
		"`ocr session diff <before> <after>`",    // alias
		"not_reviewed",                           // the JSON bucket that is easy to forget
	} {
		if !strings.Contains(string(body), want) {
			t.Errorf("%s: missing %q", path, want)
		}
	}
}

func TestCLIReferenceDocumentsSessionExport(t *testing.T) {
	path := filepath.Join("..", "..", "pages", "src", "content", "docs", "en", "cli-reference.md")
	body, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	for _, want := range []string{
		"`ocr session export [id]`",         // command-summary table row
		"### `ocr session export`",          // reference section
		"ocr session export -o review.html", // the no-id form, which is the default
		"`--output <path>`",                 // the flag that makes it archivable
	} {
		if !strings.Contains(string(body), want) {
			t.Errorf("%s: missing %q", path, want)
		}
	}
}

func TestCLIReferenceUsesSubtaskUnit(t *testing.T) {
	type localePin struct {
		locale string
		term   string
	}
	pins := []localePin{
		{locale: "en", term: "subtask"},
	}
	flagMarkers := []string{
		"| `--no-filter` |",
		"| `--concurrency <n>` |",
		"| `--timeout <minutes>` |",
		"| `--max-tools <n>` |",
		"| `--max-tokens <n>` |",
	}
	leakedConcurrencyUnits := []string{
		"file group", "file groups", "files reviewed", "file scans",
	}

	for _, pin := range pins {
		t.Run(pin.locale, func(t *testing.T) {
			path := filepath.Join("..", "..", "pages", "src", "content", "docs", pin.locale, "cli-reference.md")
			raw, err := os.ReadFile(path)
			if err != nil {
				t.Fatalf("read %s: %v", path, err)
			}
			body := string(raw)
			for _, marker := range flagMarkers {
				row, ok := firstLineContaining(body, marker)
				if !ok {
					t.Errorf("%s: missing flag row %q", path, marker)
					continue
				}
				if !strings.Contains(row, pin.term) {
					t.Errorf("%s: row %q does not use %q", path, row, pin.term)
				}
				if marker == "| `--concurrency <n>` |" {
					for _, leaked := range leakedConcurrencyUnits {
						if strings.Contains(row, leaked) {
							t.Errorf("%s: --concurrency still describes a file/file-group count (%q): %s", path, leaked, row)
						}
					}
				}
			}
		})
	}
}

func firstLineContaining(body, marker string) (string, bool) {
	for _, line := range strings.Split(body, "\n") {
		if strings.Contains(line, marker) {
			return line, true
		}
	}
	return "", false
}

func TestCLIReferenceDocumentsSessionRm(t *testing.T) {
	path := filepath.Join("..", "..", "pages", "src", "content", "docs", "en", "cli-reference.md")
	body, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	for _, want := range []string{
		"`ocr session rm <id>`",                                     // command-summary table row
		"### `ocr session rm`",                                      // reference section
		"`ocr session delete <id>`",                                 // alias
		"ocr session rm 9f2c1b4a-7e35-4d61-b2f0-6c8a41d9e72b --yes", // the flag in use, with an id shaped like a real one
		"`--yes`", // the flag itself
		"`-y`",    // and its shorthand
		"stdin",   // the non-interactive rule
	} {
		if !strings.Contains(string(body), want) {
			t.Errorf("%s: missing %q", path, want)
		}
	}
}
