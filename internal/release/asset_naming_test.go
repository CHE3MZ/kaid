// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

package release

import (
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"testing"
)

func projectRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot determine project root")
	}
	return filepath.Join(filepath.Dir(file), "../..")
}

func loadFile(t *testing.T, relPath string) string {
	t.Helper()
	data, err := os.ReadFile(filepath.Join(projectRoot(t), relPath))
	if err != nil {
		t.Fatalf("read %s: %v", relPath, err)
	}
	return string(data)
}

func TestInstallScriptsUseFork(t *testing.T) {
	for _, tc := range []struct {
		path     string
		repo     string
		prefix   string
		checksum string
	}{
		{"install.sh", `REPO="CHE3MZ/kaid"`, `ASSET_PREFIX="opencodereview"`, "sha256sum.txt"},
		{"install.ps1", "$Repo = 'CHE3MZ/kaid'", "$AssetPrefix = 'opencodereview'", "sha256sum.txt"},
	} {
		t.Run(tc.path, func(t *testing.T) {
			script := loadFile(t, tc.path)
			for _, want := range []string{tc.repo, tc.prefix, tc.checksum} {
				if !strings.Contains(script, want) {
					t.Errorf("%s does not contain %q", tc.path, want)
				}
			}
		})
	}
}

func TestInstallScriptsBuildAssetNames(t *testing.T) {
	sh := loadFile(t, "install.sh")
	if !strings.Contains(sh, `asset="${ASSET_PREFIX}-${os}-${arch}"`) {
		t.Error("install.sh does not build asset names from the prefix, OS, and architecture")
	}
	ps1 := loadFile(t, "install.ps1")
	if !strings.Contains(ps1, `$asset = "$AssetPrefix-$os-$arch.exe"`) {
		t.Error("install.ps1 does not build asset names from the prefix, OS, and architecture")
	}
}

func TestReleaseURLsUseHTTPS(t *testing.T) {
	if !strings.Contains(loadFile(t, "install.sh"), `base="https://github.com/$REPO/releases/download/$VERSION"`) {
		t.Error("install.sh should download releases over HTTPS")
	}
	if !strings.Contains(loadFile(t, "install.ps1"), `$base = "https://github.com/$Repo/releases/download/$Version"`) {
		t.Error("install.ps1 should download releases over HTTPS")
	}
}

func TestGoReleaserMatchesAssetNaming(t *testing.T) {
	prefix := installAssetPrefix(t)
	config := loadFile(t, ".goreleaser.yml")

	re := regexp.MustCompile(`name_template:\s+"([^"]+)"`)
	m := re.FindStringSubmatch(config)
	if m == nil {
		t.Fatal("cannot find archives name_template in .goreleaser.yml")
	}
	template := m[1]
	if !strings.HasPrefix(template, "{{ .ProjectName }}-") {
		t.Errorf("archives name_template %q does not start with the project name", template)
	}

	for _, p := range releasePlatforms() {
		rendered := strings.ReplaceAll(template, "{{ .ProjectName }}", prefix)
		rendered = strings.ReplaceAll(rendered, "{{ .Os }}", p.os)
		rendered = strings.ReplaceAll(rendered, "{{ .Arch }}", p.arch)
		if p.os == "windows" {
			rendered += ".exe"
		}
		expected := p.asset(prefix)
		if rendered != expected {
			t.Errorf(".goreleaser.yml produces %q, want %q", rendered, expected)
		}
	}

	if !strings.Contains(config, "name_template: sha256sum.txt") {
		t.Error(".goreleaser.yml must publish sha256sum.txt for the install scripts")
	}
	for _, want := range []string{"- linux", "- darwin", "- windows", "- amd64", "- arm64", "glob: LICENSE", "glob: NOTICE"} {
		if !strings.Contains(config, want) {
			t.Errorf(".goreleaser.yml is missing entry %q", want)
		}
	}
}

func TestReleaseWorkflowUsesGoReleaser(t *testing.T) {
	yml := loadFile(t, ".github/workflows/release.yml")
	for _, want := range []string{
		"uses: goreleaser/goreleaser-action@",
		"fetch-depth: 0",
		"args: release --clean",
		"GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}",
		"dist/**/opencodereview",
		"dist/sha256sum.txt",
	} {
		if !strings.Contains(yml, want) {
			t.Errorf("release.yml does not contain %q", want)
		}
	}
	if strings.Contains(yml, "go build") {
		t.Error("release.yml should let GoReleaser build the binaries")
	}
}

func TestMakefileBuildMatchesAssetNaming(t *testing.T) {
	prefix := installAssetPrefix(t)
	makefile := loadFile(t, "Makefile")

	re := regexp.MustCompile(`-o\s+\$\(DIST_DIR\)/([^\s\\]+)`)
	m := re.FindStringSubmatch(makefile)
	if m == nil {
		t.Fatal("cannot find BUILD_PLATFORM -o pattern in Makefile")
	}
	outputTemplate := m[1]

	for _, p := range releasePlatforms() {
		rendered := outputTemplate
		rendered = strings.ReplaceAll(rendered, "$(BINARY_NAME)", prefix)
		rendered = strings.ReplaceAll(rendered, "$(1)", p.os)
		rendered = strings.ReplaceAll(rendered, "$(2)", p.arch)
		rendered = strings.ReplaceAll(rendered, "$(3)", p.ext)
		expected := p.asset(prefix)
		if rendered != expected {
			t.Errorf("Makefile produces %q, want %q", rendered, expected)
		}
	}
}

type releasePlatform struct {
	os, arch string
	ext      string
}

func (p releasePlatform) asset(prefix string) string {
	return prefix + "-" + p.os + "-" + p.arch + p.ext
}

func releasePlatforms() []releasePlatform {
	return []releasePlatform{
		{"linux", "amd64", ""},
		{"linux", "arm64", ""},
		{"darwin", "amd64", ""},
		{"darwin", "arm64", ""},
		{"windows", "amd64", ".exe"},
		{"windows", "arm64", ".exe"},
	}
}

func installAssetPrefix(t *testing.T) string {
	t.Helper()
	re := regexp.MustCompile(`ASSET_PREFIX="([^"]+)"`)
	m := re.FindStringSubmatch(loadFile(t, "install.sh"))
	if m == nil {
		t.Fatal("cannot find ASSET_PREFIX in install.sh")
	}
	if strings.Contains(m[1], "{version}") {
		t.Errorf("asset prefix %q should not contain {version}", m[1])
	}
	return m[1]
}
