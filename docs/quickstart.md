---
title: Quickstart
---

Get your first code review running in a few minutes.

## Prerequisites

- **Git ≥ 2.41**
- **LLM API key** (not needed if using [Delegation Mode](integrations/delegate.md))

## Step 1 - Install the CLI

=== "macOS / Linux"

    ```bash
    curl -fsSL https://raw.githubusercontent.com/CHE3MZ/kaid/master/install.sh | sh
    ```

=== "Windows"

    ```powershell
    irm https://raw.githubusercontent.com/CHE3MZ/kaid/master/install.ps1 | iex
    ```

Verify the binary:

```bash
ocr version
```

!!! tip "Other install methods"

    Prefer a release binary, `go install`, or a local build? See
    [Installation](installation.md) for every option.

## Step 2 - Configure an LLM

!!! info "Using delegation mode?"

    If the host agent supplies the model, skip to Step 4. Kaid never calls an
    LLM on its own in [Delegation Mode](integrations/delegate.md).

```bash
ocr config provider
```

It lets you pick a built-in or custom provider, enter an API key, choose a
model, save everything to the config file, and then runs `ocr llm test` once
to verify the endpoint. To switch models later:

```bash
ocr config model
```

### Alternative: non-interactive command

In CI or a no-TUI environment, write to the same config directly with
`ocr config set`:

```bash
ocr config set provider                    anthropic
ocr config set model                       claude-opus-4-6
ocr config set providers.anthropic.api_key sk-ant-xxxxxxxxxx
```

## Step 3 - Test connectivity

```bash
ocr llm test
```

If you get an error like `no valid LLM endpoint configured`, recheck the Step 2
config. A 401 / 403 means the token is wrong or expired.

## Step 4 - Run your first review

Move into any Git repository and run:

```bash
cd path/to/your-repo

ocr review                                    # (1)!
ocr review --from main --to feature-branch    # (2)!
ocr review --commit abc123                    # (3)!
```

1. **Workspace mode** reviews staged, unstaged, and untracked changes. This is
   the default.
2. **Range mode** reviews the feature branch's changes since it diverged from
   `main` (merge-base mode).
3. **Commit mode** reviews only the diff introduced by that commit.

!!! tip "Preview first"

    Run `ocr review --preview` to see which files would be reviewed and which
    ones were excluded before spending a model call.

### JSON output for systems

`--audience agent` suppresses the human-friendly progress UI so the only thing
on stdout is the JSON / final summary - exactly what an upstream agent or CI
script wants.

```bash
ocr review --format json --audience agent > review.json
```

??? example "Where do the session transcripts live?"

    Every run writes a JSONL transcript under
    `~/.opencodereview/sessions/`. Run `ocr viewer` to browse it in a browser.
    See [Session Viewer](viewer.md) for the full UI.

## Next steps

[CLI Reference](cli-reference.md){ .md-button .md-button--primary }
[Configuration](configuration.md){ .md-button }
[Review Rules](review-rules.md){ .md-button }

- [Installation](installation.md) - every install method and OCR's state directory.
- [Configuration](configuration.md) - every env var, config key, and built-in provider.
- [CLI Reference](cli-reference.md) - every sub-command, flag, and output mode.
- [Review Rules](review-rules.md) - customize what gets reviewed.
- [FAQ](faq.md) - known errors and remedies.
