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
		{"scripts/install.sh", `REPO="CHE3MZ/kaid"`, `ASSET_PREFIX="kaid"`, "sha256sum.txt"},
		{"scripts/install.ps1", "$Repo = 'CHE3MZ/kaid'", "$AssetPrefix = 'kaid'", "sha256sum.txt"},
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
	sh := loadFile(t, "scripts/install.sh")
	if !strings.Contains(sh, `asset="${ASSET_PREFIX}-${os}-${arch}"`) {
		t.Error("install.sh does not build asset names from the prefix, OS, and architecture")
	}
	ps1 := loadFile(t, "scripts/install.ps1")
	if !strings.Contains(ps1, `$asset = "$AssetPrefix-$os-$arch.exe"`) {
		t.Error("install.ps1 does not build asset names from the prefix, OS, and architecture")
	}
}

func TestReleaseURLsUseHTTPS(t *testing.T) {
	if !strings.Contains(loadFile(t, "scripts/install.sh"), `base="https://github.com/$REPO/releases/download/$VERSION"`) {
		t.Error("install.sh should download releases over HTTPS")
	}
	if !strings.Contains(loadFile(t, "scripts/install.ps1"), `$base = "https://github.com/$Repo/releases/download/$Version"`) {
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
		"dist/**/kaid",
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

func TestBuildScriptMatchesAssetNaming(t *testing.T) {
	prefix := installAssetPrefix(t)
	script := loadFile(t, "scripts/build.sh")

	re := regexp.MustCompile(`BINARY_NAME="([^"]+)"`)
	m := re.FindStringSubmatch(script)
	if m == nil {
		t.Fatal("cannot find BINARY_NAME in scripts/build.sh")
	}
	if m[1] != prefix {
		t.Errorf("scripts/build.sh builds %q, want asset prefix %q", m[1], prefix)
	}
	if !strings.Contains(script, `output="$DIST_DIR/$BINARY_NAME-$os-$arch$ext"`) {
		t.Error("scripts/build.sh does not build the release asset name")
	}
	if !strings.Contains(script, `[ "$os" = "windows" ] && ext=".exe"`) {
		t.Error("scripts/build.sh does not add .exe for Windows")
	}
	for _, p := range releasePlatforms() {
		target := p.os + "/" + p.arch
		if !strings.Contains(script, target) {
			t.Errorf("scripts/build.sh does not build %s", target)
		}
	}
}

type releasePlatform struct {
	os, arch string
}

func (p releasePlatform) asset(prefix string) string {
	ext := ""
	if p.os == "windows" {
		ext = ".exe"
	}
	return prefix + "-" + p.os + "-" + p.arch + ext
}

func releasePlatforms() []releasePlatform {
	return []releasePlatform{
		{"linux", "amd64"},
		{"linux", "arm64"},
		{"darwin", "amd64"},
		{"darwin", "arm64"},
		{"windows", "amd64"},
		{"windows", "arm64"},
	}
}

func installAssetPrefix(t *testing.T) string {
	t.Helper()
	re := regexp.MustCompile(`ASSET_PREFIX="([^"]+)"`)
	m := re.FindStringSubmatch(loadFile(t, "scripts/install.sh"))
	if m == nil {
		t.Fatal("cannot find ASSET_PREFIX in install.sh")
	}
	if strings.Contains(m[1], "{version}") {
		t.Errorf("asset prefix %q should not contain {version}", m[1])
	}
	return m[1]
}
