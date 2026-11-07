---
title: Installation
sidebar:
  order: 4
---

There are four supported ways to install the `kaid` CLI.

!!! tip "Which method should I use?"

    - **Install script** - fastest path for CI base images and headless
      machines. It verifies the release checksum.
    - **Release binary** - no shell pipeline; download the file for your
      platform directly.
    - **`go install`** - you already have Go and want the latest module
      version.
    - **Build from source** - you are hacking on kaid or need a platform
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
| `KAID_INSTALL_DIR` | `/usr/local/bin` | Where to place the `kaid` binary. |
| `KAID_VERSION` | latest release | Pin a specific release tag (e.g. `v1.2.3`). |
| `KAID_GITHUB_MIRROR` | *(unset)* | Download the release binary and its checksum through a GitHub mirror domain (e.g. `gh-proxy.com`). |

The shell script supports `darwin` and `linux` on `amd64` / `arm64`. The
PowerShell installer supports Windows on `amd64` / `arm64` and defaults to
`%LOCALAPPDATA%\Programs\kaid`; set `$env:KAID_INSTALL_DIR` to change it.

#### Using a GitHub mirror

In regions where network access to GitHub is slow, set `KAID_GITHUB_MIRROR`
to a mirror domain to download the release binary and its checksum through it:

```bash
export KAID_GITHUB_MIRROR='YOUR_MIRROR_DOMAIN'
```

The value must be a bare domain name — no `https://` scheme and no trailing
slash (`gh-proxy.com`, not `https://gh-proxy.com/`). It is used as a *path
prefix* mirror: the binary is fetched from
`https://<mirror>/github.com/CHE3MZ/kaid/releases/download/<version>/…`.
Domain-substitution mirrors (e.g. one that rewrites `github.com` to
`hub.example.org`) won't match this shape — use a path-prefix mirror instead.

The mirror covers both the release binary and its `sha256sum.txt` checksum.
Version resolution (when `KAID_VERSION` is unset) still calls the GitHub API
directly, not the mirror. To skip version resolution entirely, pin a version:

```bash
export KAID_VERSION='v1.2.3'
```

!!! warning "Mirror mode weakens integrity checks"

    The mirror is a third-party service. When `KAID_GITHUB_MIRROR` is set, both
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
curl -Lo kaid https://github.com/CHE3MZ/kaid/releases/latest/download/kaid-darwin-arm64
chmod +x kaid && sudo mv kaid /usr/local/bin/kaid

# macOS (Intel)
curl -Lo kaid https://github.com/CHE3MZ/kaid/releases/latest/download/kaid-darwin-amd64
chmod +x kaid && sudo mv kaid /usr/local/bin/kaid

# Linux x86_64
curl -Lo kaid https://github.com/CHE3MZ/kaid/releases/latest/download/kaid-linux-amd64
chmod +x kaid && sudo mv kaid /usr/local/bin/kaid

# Linux ARM64
curl -Lo kaid https://github.com/CHE3MZ/kaid/releases/latest/download/kaid-linux-arm64
chmod +x kaid && sudo mv kaid /usr/local/bin/kaid

# Windows (AMD64)
curl -Lo kaid.exe https://github.com/CHE3MZ/kaid/releases/latest/download/kaid-windows-amd64.exe

# Windows (ARM64)
curl -Lo kaid.exe https://github.com/CHE3MZ/kaid/releases/latest/download/kaid-windows-arm64.exe
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
go install github.com/CHE3MZ/kaid/cmd/kaid@latest
```

This installs `kaid` into `$(go env GOPATH)/bin` (usually
`~/go/bin`). Make sure that directory is on your `PATH`.

`go install` builds directly from the module source without the release
ldflags, so `kaid version` may report `dev` instead of a release tag.

## Build from source

You only need this path if you're hacking on kaid or running on a platform
without a pre-built binary.

#### Prerequisites

- [Go ≥ 1.26.10](https://go.dev/dl/)
- [Git](https://git-scm.com/)
- A POSIX shell such as Bash (on Windows, use Git Bash or WSL)
- [Task v3](https://taskfile.dev/), only for the `task test` and `task check` shortcuts

#### Build

```bash
git clone https://github.com/CHE3MZ/kaid.git
cd kaid
./scripts/build.sh
```

On Windows, run it through Git Bash:

```bash
sh scripts/build.sh
```

`scripts/build.sh` builds all six release targets into `dist/`:

- `dist/kaid-linux-amd64`
- `dist/kaid-linux-arm64`
- `dist/kaid-darwin-amd64`
- `dist/kaid-darwin-arm64`
- `dist/kaid-windows-amd64.exe`
- `dist/kaid-windows-arm64.exe`

It also writes `dist/sha256sum.txt` and `dist/VERSION`. Override the version
stamp with `VERSION`, for example `VERSION=1.2.3 ./scripts/build.sh`.

Copy the binary for your platform into your `PATH`, for example:

```bash
sudo cp dist/kaid-linux-amd64 /usr/local/bin/kaid
```

Official releases are built with GoReleaser in CI.

#### Run tests

```bash
task test               # LC_ALL=C go test -v -race -count=1 ./...
```

## Verifying the install

Wherever you got the binary from:

```bash
kaid version             # prints version + git commit + build date
kaid --help              # top-level usage
kaid review --help       # full review-command flag list
```

If you see a "command not found" error, double-check that the install
location is on your `$PATH`:

```bash
which kaid
echo $PATH
```

## Enable Shell Completion (optional)

`kaid` supports tab-completion for bash, zsh, fish, and PowerShell.

```bash
# bash
source <(kaid completion bash)

# zsh
kaid completion zsh > "${fpath[1]}/_kaid"
```

See the [CLI Reference](./cli-reference.md#kaid-completion) for fish,
PowerShell, and persistent setup instructions.


## Where kaid stores state

| Path | What it holds |
|---|---|
| `~/.kaid/config.json` | LLM endpoint, language, telemetry config (managed by `kaid config set`). |
| `~/.kaid/rule.json` | Optional global review rules. |
| `~/.kaid/sessions/<encoded-repo-path>/<session-id>.jsonl` | Streaming JSONL transcript of every review session, used by `kaid viewer`. |
| `<repo>/.kaid/rule.json` | Optional per-project review rules — safe to commit. |

kaid never writes outside `~/.kaid/` (besides the transient binary
download via the install script). Removing the directory is a clean uninstall.

## Next steps

[Quickstart :material-rocket-launch:](quickstart.md){ .md-button .md-button--primary }
[Configuration :material-cog:](configuration.md){ .md-button }

- [Quickstart](quickstart.md) - configure an LLM and run your first review.
- [Configuration](configuration.md) - every env var and config key kaid honors.
- [AGENTS.md](https://github.com/CHE3MZ/kaid/blob/master/AGENTS.md) - build from source, run tests, and hack on kaid.

*[CI]: Continuous Integration
*[CLI]: Command-Line Interface
*[JSONL]: JSON Lines
