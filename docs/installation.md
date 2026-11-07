---
title: Installation
sidebar:
  order: 4
---

There are four supported ways to install the `ocr` CLI.

!!! tip "Which method should I use?"

    - **Install script** - fastest path for CI base images and headless
      machines. It verifies the release checksum.
    - **Release binary** - no shell pipeline; download the file for your
      platform directly.
    - **`go install`** - you already have Go and want the latest module
      version.
    - **Build from source** - you are hacking on Kaid or need a platform
      without a pre-built binary.

## Install script (curl | sh)

A convenience installer that wraps the GitHub Release binary download
(with checksum verification):

=== "macOS / Linux"

    ```bash
    curl -fsSL https://raw.githubusercontent.com/CHE3MZ/kaid/master/scripts/install.sh | sh
    ```

=== "Windows (PowerShell 5.1+)"

    ```powershell
    irm https://raw.githubusercontent.com/CHE3MZ/kaid/master/scripts/install.ps1 | iex
    ```

Both installers honour three environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `OCR_INSTALL_DIR` | `/usr/local/bin` | Where to place the `ocr` binary. |
| `OCR_VERSION` | latest release | Pin a specific release tag (e.g. `v1.2.3`). |
| `OCR_GITHUB_MIRROR` | *(unset)* | Download the release binary and its checksum through a GitHub mirror domain (e.g. `gh-proxy.com`). |

The shell script supports `darwin` and `linux` on `amd64` / `arm64`. The
PowerShell installer supports Windows on `amd64` / `arm64` and defaults to
`%LOCALAPPDATA%\Programs\ocr`; set `$env:OCR_INSTALL_DIR` to change it.

#### Using a GitHub mirror

In regions where network access to GitHub is slow, set `OCR_GITHUB_MIRROR`
to a mirror domain to download the release binary and its checksum through it:

```bash
export OCR_GITHUB_MIRROR='YOUR_MIRROR_DOMAIN'
```

The value must be a bare domain name — no `https://` scheme and no trailing
slash (`gh-proxy.com`, not `https://gh-proxy.com/`). It is used as a *path
prefix* mirror: the binary is fetched from
`https://<mirror>/github.com/CHE3MZ/kaid/releases/download/<version>/…`.
Domain-substitution mirrors (e.g. one that rewrites `github.com` to
`hub.example.org`) won't match this shape — use a path-prefix mirror instead.

The mirror covers both the release binary and its `sha256sum.txt` checksum.
Version resolution (when `OCR_VERSION` is unset) still calls the GitHub API
directly, not the mirror. To skip version resolution entirely, pin a version:

```bash
export OCR_VERSION='v1.2.3'
```

!!! warning "Mirror mode weakens integrity checks"

    The mirror is a third-party service. When `OCR_GITHUB_MIRROR` is set, both
    the binary and its `sha256sum.txt` are downloaded from it, so a malicious
    mirror can serve a tampered binary together with a matching checksum. If
    you cannot trust the mirror, verify the downloaded file against the
    upstream `sha256sum.txt` on the
    [releases page](https://github.com/CHE3MZ/kaid/releases).

## GitHub Release binary

If you prefer a direct download, grab the static binary from the
[releases page](https://github.com/CHE3MZ/kaid/releases):

```bash
# macOS (Apple Silicon)
curl -Lo ocr https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-darwin-arm64
chmod +x ocr && sudo mv ocr /usr/local/bin/ocr

# macOS (Intel)
curl -Lo ocr https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-darwin-amd64
chmod +x ocr && sudo mv ocr /usr/local/bin/ocr

# Linux x86_64
curl -Lo ocr https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-linux-amd64
chmod +x ocr && sudo mv ocr /usr/local/bin/ocr

# Linux ARM64
curl -Lo ocr https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-linux-arm64
chmod +x ocr && sudo mv ocr /usr/local/bin/ocr

# Windows (AMD64)
curl -Lo ocr.exe https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-windows-amd64.exe

# Windows (ARM64)
curl -Lo ocr.exe https://github.com/CHE3MZ/kaid/releases/latest/download/opencodereview-windows-arm64.exe
```

Each release also publishes `sha256sum.txt` next to the binaries so you can
verify integrity:

```bash
curl -LO https://github.com/CHE3MZ/kaid/releases/latest/download/sha256sum.txt
shasum -a 256 -c sha256sum.txt --ignore-missing
```

## go install

With Go 1.26.10 or newer:

```bash
go install github.com/CHE3MZ/kaid/cmd/opencodereview@latest
```

This installs `opencodereview` into `$(go env GOPATH)/bin` (usually
`~/go/bin`). The CLI is invoked as `ocr`, so rename it or create a link:

```bash
mv "$(go env GOPATH)/bin/opencodereview" "$(go env GOPATH)/bin/ocr"
```

On Windows:

```powershell
Rename-Item "$(go env GOPATH)\bin\opencodereview.exe" ocr.exe
```

`go install` builds directly from the module source without the release
ldflags, so `ocr version` may report `dev` instead of a release tag.

## Build from source

You only need this path if you're hacking on OCR or running on a platform
without a pre-built binary.

#### Prerequisites

- [Go ≥ 1.26.10](https://go.dev/dl/)
- [Git](https://git-scm.com/)
- [Make](https://www.gnu.org/software/make/)

#### Build

```bash
git clone https://github.com/CHE3MZ/kaid.git
cd kaid
make build              # writes dist/opencodereview (dist/opencodereview.exe on Windows)
sudo cp dist/opencodereview /usr/local/bin/ocr
```

#### Build for another platform

```bash
make build-linux-amd64
make build-linux-arm64
make build-darwin-amd64
make build-darwin-arm64
make build-windows-amd64   # Windows (x86_64)
make build-windows-arm64   # Windows (ARM64)
make build-all          # all six at once
make sha256sum          # also produce sha256sum.txt
```

`make dist` runs `clean → build-all → sha256sum` and writes a `VERSION`
file alongside the binaries — useful for reproducing release builds
locally. Official releases are built with GoReleaser in CI.

#### Run tests

```bash
make test               # LC_ALL=C go test -v -race -count=1 ./...
```

## Verifying the install

Wherever you got the binary from:

```bash
ocr version             # prints version + git commit + build date
ocr --help              # top-level usage
ocr review --help       # full review-command flag list
```

If you see a "command not found" error, double-check that the install
location is on your `$PATH`:

```bash
which ocr
echo $PATH
```

## Enable Shell Completion (optional)

`ocr` supports tab-completion for bash, zsh, fish, and PowerShell.

```bash
# bash
source <(ocr completion bash)

# zsh
ocr completion zsh > "${fpath[1]}/_ocr"
```

See the [CLI Reference](./cli-reference.md#ocr-completion) for fish,
PowerShell, and persistent setup instructions.


## Where OCR stores state

| Path | What it holds |
|---|---|
| `~/.opencodereview/config.json` | LLM endpoint, language, telemetry config (managed by `ocr config set`). |
| `~/.opencodereview/rule.json` | Optional global review rules. |
| `~/.opencodereview/sessions/<encoded-repo-path>/<session-id>.jsonl` | Streaming JSONL transcript of every review session, used by `ocr viewer`. |
| `<repo>/.opencodereview/rule.json` | Optional per-project review rules — safe to commit. |

OCR never writes outside `~/.opencodereview/` (besides the transient binary
download via the install script). Removing the directory is a clean uninstall.

## Next steps

[Quickstart :material-rocket-launch:](quickstart.md){ .md-button .md-button--primary }
[Configuration :material-cog:](configuration.md){ .md-button }

- [Quickstart](quickstart.md) - configure an LLM and run your first review.
- [Configuration](configuration.md) - every env var and config key OCR honors.
- [AGENTS.md](https://github.com/CHE3MZ/kaid/blob/master/AGENTS.md) - build from source, run tests, and hack on OCR.

*[CI]: Continuous Integration
*[CLI]: Command-Line Interface
*[JSONL]: JSON Lines
