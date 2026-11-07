---
title: CLI Reference
sidebar:
  order: 6
---

The complete reference for every `kaid` subcommand, flag, and exit
behaviour.

## Global usage

```text
kaid - AI-Powered Code Review CLI

Usage:
  kaid [command]

Commands:
  review, r    Start a code review
  rules        Inspect and debug review rules
  config       Manage configuration settings
  llm          LLM utility commands
  viewer       Start the WebUI session viewer
  session, sessions  List and inspect saved review sessions
  version      Show version information

Examples:
  kaid review --from master --to dev        Review diff range
  kaid review --commit abc123               Review a single commit
  kaid review --background "Focus on auth"                                           Review with inline context
  kaid review -B ./docs/requirements.md                                              Review with context file
  kaid config provider                      Interactive provider setup
  kaid config model                         Interactive model selection
  kaid config set llm.model opus-4-6        Set a config value
  kaid llm test                             Test LLM connectivity
  kaid llm providers                        List built-in providers
  kaid session list                         List saved review sessions
  kaid version                              Show version info

Use "kaid review -h" for more information about review.
Use "kaid rules -h" for more information about rules.
Use "kaid config" for more information about config.
Use "kaid llm" for more information about LLM utilities.
Use "kaid session -h" for more information about session inspection.

GitHub: https://github.com/CHE3MZ/kaid
```

## Global flags

Available on every command, and accepted either before or after the subcommand
(`kaid --color=never review` and `kaid review --color=never` are equivalent).

| Flag | Default | What it does |
|---|---|---|
| `--color <auto\|always\|never>` | `auto` | When to emit ANSI color. `auto` colorizes only when stdout is a terminal, so piping or redirecting yields plain text. `always` keeps color through a pipe (useful for `\| less -R`). |

Text output is plain whenever stdout is not a terminal, so it can be piped
safely:

```bash
kaid review --commit HEAD | gh issue comment 123 --body-file -
```

`TERM=dumb` also disables color.

## Command summary

| Command | Alias | What it does |
|---|---|---|
| `kaid review` | `kaid r` | Run a code review and emit comments. |
| `kaid scan` | `kaid s` | Scan complete files without requiring a Git diff. |
| `kaid rules check <file>` | — | Show which rule applies to a given file path and where it came from. |
| `kaid config set <key> <value>` | — | Persist a config value to `~/.kaid/config.json`. |
| `kaid config unset custom_providers.<name>` | — | Delete a custom provider (clears active `provider`/`model` if it was active). |
| `kaid config provider` | — | Interactive provider-setup TUI. |
| `kaid config model` | — | Interactive model-selection TUI. |
| `kaid llm test` | — | Send a small chat request to verify the configured endpoint. |
| `kaid llm providers` | — | List all built-in LLM providers. |
| `kaid session list` | `kaid sessions list`, `kaid session ls` | List saved review sessions. |
| `kaid session show <id>` | `kaid sessions show <id>` | Inspect one session and its per-file checkpoints. |
| `kaid session comments <id>` | `kaid sessions comments <id>` | Print the review comments recorded in one session. |
| `kaid session compare <before> <after>` | `kaid session diff <before> <after>` | Compare two sessions' findings: new, persisting, resolved, not reviewed. |
| `kaid session export [id]` | — | Export one session as a self-contained HTML file. |
| `kaid session rm <id>` | `kaid session delete <id>`, `kaid session remove <id>` | Delete one saved review session. |
| `kaid viewer` | — | Launch the local web UI for past review sessions (`localhost:5483`). |
| `kaid version` | — | Print version, commit, platform, build date, and GitHub URL. |

`kaid` and `kaid -h` print top-level usage. Each subcommand also accepts
`-h` / `--help`.

## `kaid review`

The main command. Resolves a Git diff, groups the changed files
semantically, dispatches one sub-agent per group, collects review
comments, and prints them.

### Synopsis

```text
kaid review [flags]
kaid r      [flags]   (alias)
```

If no flags are passed, kaid runs in **workspace mode** — review of all
staged + unstaged + untracked changes in the current directory's repo.

### Flags

| Flag | Short | Default | Description |
|---|---|---|---|
| `--repo <path>` | — | current dir | Git repository root. |
| `--from <ref>` | — | — | Source ref to start the diff from (e.g., `main`). |
| `--to <ref>` | — | — | Target ref to end the diff at (e.g., `feature-branch`). When set, kaid computes `merge-base(from, to)..to`. |
| `--commit <sha>` | `-c` | — | Single commit to review (vs its parent). |
| `--preview` | `-p` | `false` | Run the filter pipeline but skip the LLM. Prints the file list and exclusion reasons. Honors `--format json`; `--format sarif` is not supported (a preview has no completed findings to emit). |
| `--no-filter` | — | `false` | Keep all review comments and skip the per-subtask `REVIEW_FILTER_TASK` LLM post-processing call. A subtask reviews a single file or a bundle of related files. |
| `--resume <session-id>` | — | — | Resume from a previous compatible range or commit review session. |
| `--format <fmt>` | `-f` | `text` | `text` (human-readable), `json` (machine-readable comment array), or `sarif` (SARIF 2.1.0 report for GitHub Code Scanning). |
| `--output <path>` | `-o` | stdout | Write review results to a UTF-8 file (`-` means stdout). Lazily created on first write so failed runs leave existing files untouched. Text format automatically strips ANSI color codes. |
| `--audience <who>` | — | `human` | `human` streams progress lines (to stderr when `--format` is `json`/`sarif`, so stdout stays a single parseable document); `agent` suppresses progress entirely and prints only the final summary / JSON. |
| `--background <text>` | `-b` | — | Optional requirement / business context injected into the plan + main prompts. |
| `--background-file <path>` | `-B` | — | Path to a Markdown file used as review background. Takes precedence over `--background` when both are set. |
| `--exclude <patterns>` | — | — | Comma-separated gitignore-style patterns to exclude; merged with the `excludes` section of `rule.json` |
| `--concurrency <n>` | — | `8` | Maximum number of subtasks reviewed in parallel. |
| `--timeout <minutes>` | — | `15` | Per-subtask budget, including LLM calls, tools, and retry waits. `0` disables the task deadline, not request timeouts. Independent request timeout: `KAID_LLM_TIMEOUT` or provider `timeout_sec`, in seconds (default `300`). Scaled linearly by the number of effort review rounds (e.g. 15/30/45 min for low/medium/high). |
| `--effort <level>` | — | `medium` | Review effort preset: `low` (1 review round), `medium` (2 rounds), `high` (3 rounds). More rounds improve recall at proportionally higher cost. Overrides the saved `effort` setting for this run. |
| `--rule <path>` | — | — | Path to a custom JSON review rule file. Overrides the project-level and global `rule.json`. |
| `--max-tools <n>` | — | template default | Max tool-call rounds per subtask. `0` uses the template default (`100`); values 1–49 are clamped up to `50`. The flag only ever *raises* the cap — a value below the template default is ignored. |
| `--max-tokens <n>` | — | config or template default | Prompt (input) token ceiling per subtask; the template default is `200000`. Overrides the saved `max_tokens` setting for this run. Does not change the output cap — see `MAX_COMPLETION_TOKENS`. |
| `--max-tokens-budget <n>` | — | `0` (unlimited) | Cap total input + output token usage for the review. Checked before every LLM round: a subtask already over budget gets one final round to submit findings and is reported as `failed(budget)`, no further subtasks are dispatched, and partial results are still published. |
| `--provider <name>` | — | — | Select a configured provider for this run. Names under both `providers` and `custom_providers` are accepted. |
| `--model <name>` | — | — | Override the resolved LLM model for this run (e.g., `claude-opus-4-6`). |
| `--max-git-procs <n>` | — | `16` | Maximum number of concurrent git subprocesses. |
| `--tools <path>` | — | embedded | Path to a custom JSON tool-config file. Overrides the embedded tool definitions. |

> Mode flags are mutually exclusive: pass either `--from`/`--to`, or
> `--commit`, or neither (workspace mode). Mixing them is a hard error.
> `--resume` supports only range or commit reviews and cannot be combined
> with `--preview`.

### Per-run LLM selection

Both `review` and `scan` accept `--provider` and `--model`. The overrides
apply only to the current invocation and do not modify saved configuration:

```bash
kaid review --provider anthropic --model claude-opus-4-6 --format json
kaid scan --provider openai --model gpt-5.4 --format json
```

An explicit `--provider` selects a saved entry from `providers` or
`custom_providers` before normal source resolution. Without `--provider`, kaid
preserves the legacy source order: saved configuration, complete `KAID_LLM_*`
environment configuration, complete Anthropic-compatible environment configuration, then
shell rc files. `--model` overrides the model within whichever source wins; it
does not change that source order. Incomplete strategies fall through without
being mixed. A selected built-in provider's credentials may still come from its
supported environment variable.

For built-in providers, `--model` accepts IDs outside the suggested models in
`kaid config model`. If the ID is absent from both the built-in list and
`providers.<name>.models`, kaid warns on stderr and leaves validation to the
provider. Custom providers retain their existing `--model` validation rules.

### Modes

=== "Workspace (default)"

    ```bash
    kaid review
    ```

    kaid assembles the working-tree changes from two git commands:

    - tracked changes via `git diff HEAD` (staged + unstaged combined against
      `HEAD`; if that comes back empty, kaid falls back to `git diff --staged`)
    - untracked files via `git ls-files --others --exclude-standard`, read
      from disk and treated as full-file additions

    This is what you usually want pre-commit. Stage selectively if you want
    narrower scope.

=== "Range"

    ```bash
    kaid review --from main --to feature-branch
    ```

    kaid computes `merge-base(main, feature-branch)..feature-branch` so you only
    see the diff *introduced by* the feature branch - not unrelated changes
    that landed on `main` since branching.

=== "Commit"

    ```bash
    kaid review --commit abc123
    kaid review -c abc123
    ```

    Reviews the diff produced by `git show abc123` (i.e., the changes that
    single commit introduced).

### Resuming interrupted reviews

Every `kaid review` run persists a local session log under
`~/.kaid/sessions/`. Successful text output stays focused on review
results and does not print the session ID; use `kaid session list/show` to find
saved sessions, or `--format json` to include `session_id` in machine-readable
output. If a range or commit review is interrupted, list saved sessions and
resume from one that matches the same review target:

```bash
kaid session list
kaid session show <session-id>
kaid session comments <session-id>
kaid review --from main --to feature-branch --resume <session-id>
kaid review --commit abc123 --resume <session-id>
```

Resume is strict by design. Checkpoints are only reused when the resumed run
would review the same thing the parent did:

- workspace reviews cannot be resumed
- the review mode must match: a range session cannot be resumed as a commit one
- the resolved input must match. Ref *spellings* are not compared — `abc1234`
  and `abc1234def` name the same commit — but if the same refs now resolve to a
  different diff, or the rules or filters changed the selected file set, the
  whole resume is rejected rather than partially reused
- a provider or model change must be asked for explicitly with `--provider` /
  `--model`. A change that arrived through config or the environment is rejected
- the parent must carry a run manifest, which is what its input is verified
  against. After file dispatch begins, Ctrl-C cancels the review gracefully and
  records one, so completed checkpoints remain resumable. A process killed
  before graceful shutdown and sessions older than run manifests do not have one
- only files the parent's manifest settled are reused. A checkpoint the manifest
  does not account for, or one that is unreadable, costs that file its
  checkpoint and nothing more — it is simply reviewed again
- `--preview` and `--resume` cannot be used together

A rejected resume writes nothing: no session, no manifest, no LLM call.

### Output

#### Text (default, `--audience human`)

Progress lines stream as the review runs, followed by one block per
comment (a dim Unicode-rule header with `path:start-end`, the comment
body wrapped to 100 columns, and — when present — a colored inline diff
of the suggested replacement). A run summary lands on stdout at the end:

```
[kaid] 17 file(s) changed, reviewing 9 in /path/to/repo
[kaid] Skipping image.png — filtered by path/extension rules
[kaid]   ▶ file_read "src/foo.go"
[kaid]   ✔ file_read (12ms)
[kaid] Plan completed for src/foo.go
…

─── src/foo.go:42-47 ───
Concurrent map access without a lock — wrap with sync.RWMutex.

- m[k] = v
+ mu.Lock(); defer mu.Unlock(); m[k] = v

…
[kaid] Summary: 9 file(s) reviewed, 14 comment(s), ~21344 token(s) used (input: ~18012, output: ~3332), 1m12s elapsed
```

#### Text (agent, `--audience agent`)

Identical comment output, but progress lines are suppressed via an internal
quiet-able stdout writer ([`internal/stdout`](https://github.com/CHE3MZ/kaid/blob/master/internal/stdout/stdout.go)).
Use this in CI / when piping into another agent.

#### JSON

```bash
kaid review --format json --audience agent
```

The document is always written to stdout on its own. With the default
`--audience human` the `[kaid]` progress lines stream to **stderr** as the review
runs, so you can watch a long run and still pipe stdout straight into a parser:

```bash
kaid review --format json > result.json   # progress still visible on the terminal
kaid review --format json | jq .summary   # stdout is a single JSON document
```

Pass `--audience agent` to drop the progress lines altogether, or `2>/dev/null`
to discard them at the shell.

```json
{
  "status": "success",
  "llm": {
    "provider": "anthropic",
    "model": "claude-opus-4-6"
  },
  "summary": {
    "files_reviewed": 9,
    "comments": 1,
    "total_tokens": 21344,
    "input_tokens": 18012,
    "output_tokens": 3332,
    "elapsed": "1m12s"
  },
  "comments": [
    {
      "path": "src/foo.go",
      "content": "Concurrent map access without a lock — wrap with sync.RWMutex.",
      "start_line": 42,
      "end_line": 47,
      "existing_code": "m[k] = v",
      "suggestion_code": "mu.Lock(); defer mu.Unlock(); m[k] = v",
      "thinking": "Looking at line 42, the map …"
    }
  ]
}
```

Top-level fields:

| Field | Notes |
|---|---|
| `status` | When the output includes a `manifest` field, its terminal state: `complete`, `partial`, `failed`, or `skipped`. Otherwise: `success`, `completed_with_warnings`, or `completed_with_errors`. `skipped` also covers the no-supported-files case. |
| `llm` | Resolved LLM identity. The normalized `model` is always present; `provider` is present only for a named configured provider. |
| `message` | Optional. Human-readable summary, e.g. `"No comments generated. Looks good to me."`. |
| `summary` | Optional. Run aggregates: `files_reviewed`, `comments`, `total_tokens`, `input_tokens`, `output_tokens`, `cache_read_tokens` (omitempty), `cache_write_tokens` (omitempty), `elapsed`. Omitted for `skipped` runs. |
| `comments` | Always present, possibly empty. Per-comment fields are the ones in the example above. |
| `warnings` | Optional. Present when one or more sub-agents failed; each entry describes the affected file and the error. |
| `session_id` | Optional. Present on persisted review runs; pass this to `kaid review --resume <session-id>` when retrying compatible range or commit reviews. |
| `resume` | Optional. Present on resumed runs with `resumed_from`, `reused_files`, `rerun_files`, `previous_model`, and `current_model`. |

When no files were eligible for review, JSON mode emits a `skipped`
envelope instead so callers can distinguish "no changes" from "no findings":

```json
{
  "status": "skipped",
  "message": "No supported files changed.",
  "llm": {
    "provider": "anthropic",
    "model": "claude-opus-4-6"
  },
  "comments": []
}
```

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Review completed (possibly with zero comments, possibly with non-fatal warnings). |
| `1` | Fatal error - bad flags, can't resolve LLM endpoint, all per-group sub-agents failed, etc. The error text is printed to stderr. |

!!! warning "Exit codes are part of the CI contract"

    Non-fatal warnings (a single sub-agent failed, a file exceeded the token
    threshold, etc.) are printed inline; in JSON mode they're added to the
    `warnings` array. They do not change the exit code. Treat `1` as "the
    review could not run", not "the review found problems".

## `kaid scan`

Full-file review without a Git diff. Each file's current content is read
from the working tree and sent to the LLM — useful for auditing an
unfamiliar codebase or a directory with no meaningful diff.

```text
kaid scan [flags]
kaid s      [flags]   (alias)
```

With no `--path`, the whole repository is scanned.

### Flags

| Flag | Short | Default | Description |
|---|---|---|---|
| `--path <list>` | - | whole repo | Comma-separated repo-relative directories or files to scan (e.g., `internal/agent`, `internal/llm/client.go`). Selectors resolve against the working tree: the spelled path wins over a case-variant sibling, a differently-cased spelling that the filesystem resolves (Windows, default macOS) still selects the tracked files, and a selector that names no existing path is an error rather than an empty scan. |
| `--exclude <patterns>` | - | - | Comma-separated gitignore-style patterns to skip (e.g., `**/generated/*,*.pb.go`); merged with `rule.json` excludes. |
| `--output <path>` | `-o` | stdout | Write scan results to a UTF-8 file (`-` means stdout). Lazily created on first write so failed runs leave existing files untouched. Text format automatically strips ANSI color codes. |
| `--preview` | `-p` | `false` | Enumerate and filter files without calling the LLM. Prints the file list, reviewable/excluded counts, total lines, and per-file exclusion reasons. Honors `--format json`; `--format sarif` is not supported. |

```bash
kaid scan --preview                              # see what would be scanned
kaid scan --path internal/agent                  # scan one directory
kaid scan --path internal/agent,internal/llm/client.go
kaid scan --exclude '**/generated/*,*.pb.go'
```

See `kaid scan -h` for the full flag list.

## `kaid session`

Lists and inspects local review session logs saved under
`~/.kaid/sessions/`. Use it to find a session ID, inspect
per-file checkpoint status, and resume interrupted range or commit reviews.

```text
kaid session <sub-command>
kaid sessions <sub-command>   (alias)

Sub-commands:
  list, ls        List recent review sessions for the current repo
  show <id>       Show one session's metadata and per-file items
  comments <id>   Show the review comments recorded in one session
```

### `kaid session list`

```bash
kaid session list
kaid session list --limit 50
kaid session list --json
```

| Flag | Default | Description |
|---|---|---|
| `--repo <path>` | current dir | Repository whose sessions should be listed. |
| `--json` | `false` | Emit session summaries as JSON. |
| `--limit <n>` | `20` | Cap the number of listed sessions. Use `0` for unlimited. |

### `kaid session show`

A resumed run also prints the run it continued, and the provider/model
transition when the resume crossed one.

```bash
kaid session show <session-id>
kaid session show --json <session-id>
kaid session show --repo /path/to/repo <session-id>
```

| Flag | Default | Description |
|---|---|---|
| `--repo <path>` | current dir | Repository whose session should be inspected. |
| `--json` | `false` | Emit session metadata and per-file items as JSON. |

### `kaid session comments`

Prints every review comment persisted in a session, rendered in the same
style as `kaid review` terminal output (path, line range, severity badge,
suggestion diff).

```bash
kaid session comments <session-id>
kaid session comments --json <session-id>
kaid session comments --severity high <session-id>
kaid session comments --severity critical,high --category bug,security <session-id>
```

| Flag | Default | Description |
|---|---|---|
| `--repo <path>` | current dir | Repository whose session should be inspected. |
| `--json` | `false` | Emit the comments as a JSON array. |
| `--severity <list>` | all | Comma-separated severities to include (`critical`, `high`, `medium`, `low`). |
| `--category <list>` | all | Comma-separated categories to include (e.g. `bug`, `security`). |

### `kaid session compare`

Groups the findings of two sessions into four buckets: **new** (only in the
after session), **persisting** (in both), **resolved** (only in the before
session) and **not reviewed** (in the before session, in files the after
session never looked at, so they are not counted as resolved).

Findings are matched on path, category and the offending snippet, not on line
numbers, so a finding that only moved down the file still counts as
persisting. When the after session's manifest records a file rename, the old
path is mapped to the new path before matching.

```bash
kaid session compare <before-session-id> <after-session-id>
kaid session diff <before-session-id> <after-session-id>
kaid session compare --json <before-session-id> <after-session-id>
```

Both sessions must belong to the same repository; otherwise the command
fails. Different review modes only print a warning on stderr, so `--json`
output stays pipeable.

| Flag | Default | Description |
|---|---|---|
| `--repo <path>` | current dir | Repository whose sessions should be compared. |
| `--json` | `false` | Emit the comparison as JSON (`new`, `persisting`, `resolved`, `not_reviewed`). |

### `kaid session export`

Renders one session as a single self-contained HTML file. The viewer's
stylesheet and script are inlined, so the artifact opens over `file://` with no
network access at all and CI can archive a review as a build artifact.

```bash
kaid session export -o review.html
kaid session export 20250601-100000-abc123 -o review.html
```

With no session id the newest session for the repository is exported. That is
the default because a *successful* `kaid review` never prints its session id.
Without `-o` the HTML goes to stdout.

The exported page embeds the reviewed source excerpts the session recorded, so
treat the file with the same care as the repository itself before publishing it.

| Flag | Default | Description |
|---|---|---|
| `--repo <path>` | current dir | Repository whose session should be exported. |
| `--output <path>`, `-o` | stdout | Write the HTML to a file instead of stdout. |

### `kaid session rm`

Deletes one persisted session from `~/.kaid/sessions/`.

```bash
kaid session rm 9f2c1b4a-7e35-4d61-b2f0-6c8a41d9e72b
kaid session rm 9f2c1b4a-7e35-4d61-b2f0-6c8a41d9e72b --yes
kaid session rm 9f2c1b4a-7e35-4d61-b2f0-6c8a41d9e72b --repo ~/work/my-project
```

The id is enough on its own, so the command runs from any directory. If the same
id is saved for more than one repository, the candidates are listed and nothing
is deleted; pass `--repo` to pick one.

The session's repository, branch, start time, file count and comment count are
printed, and you are asked to confirm. **A non-interactive stdin answers no**, so
a pipeline or a CI job must pass `--yes` (`-y`) to skip the prompt.

A session whose metadata cannot be parsed is still deletable; one that cannot be
read at all is reported instead. With `--repo`, a session that records a
different repository, or none, is refused: delete it by id alone.

| Flag | Default | Description |
|---|---|---|
| `--repo <path>` | every repository | Only look for the session under this repository. |
| `--yes`, `-y` | `false` | Skip the confirmation prompt. |

## `kaid rules`

Rule introspection. There is exactly one subcommand:

```text
kaid rules check [flags] <file-path>

Flags:
  --repo <path>    Git repository root (default: current dir)
  --rule <path>    Path to a custom rule JSON file
```

For the given file path, kaid:

1. Walks the four-layer rule chain (custom → project → global → system).
2. Picks the first match.
3. Prints the **source layer**, the **glob pattern** that matched, and the
   resolved **rule text**.

```bash
$ kaid rules check src/main/java/com/example/Foo.java
File: src/main/java/com/example/Foo.java
Source: System built-in
Pattern: **/*.java
Rule:
────────────────────────────────────────
<contents of internal/config/rules/rule_docs/java.md>
────────────────────────────────────────
```

Useful for debugging "why isn't my custom rule firing?" — see
[Review Rules](review-rules.md) for the full priority story.

## `kaid config`

Persists keys to `~/.kaid/config.json` and offers interactive
setup TUIs. Four subcommands:

```text
kaid config set <key> <value>
kaid config unset <key>                     Clear a saved key
kaid config provider                        Interactive provider setup
kaid config model                           Interactive model selection
```

- **`set`** — write a single config value non-interactively. `effort`
  accepts `low` / `medium` / `high` and sets the default review effort for
  every run; `--effort` overrides it per invocation.
- **`unset`** — clear a saved key. `provider`, `max_tokens`, `effort`,
  `custom_providers.<name>`, and `mcp_servers.<name>` are supported.
  Clearing `effort` restores the default `medium` preset. If a deleted
  provider was the active one, `provider` and `model` are cleared (run
  `kaid config provider` to pick a new one).
- **`provider`** — launch the interactive provider-setup TUI (no extra
  arguments; use `kaid config set provider <name>` for non-interactive
  setup).
- **`model`** — launch the interactive model-selection TUI (no extra
  arguments; use `kaid config set model <name>` for non-interactive
  setup).

See [Configuration](configuration.md) for the full key reference,
schemas, and examples.



## `kaid auth`

Sign in with ChatGPT is the default for `kaid auth login`, `status` and `logout`. Explicit `--provider chatgpt` remains supported.

Use the documented Sign in with ChatGPT flow with the `chatgpt` provider. See the [ChatGPT preview guide](chatgpt-preview.md).

```bash
kaid auth login --provider chatgpt
kaid auth login --provider chatgpt --no-browser
kaid auth login --provider chatgpt --enable-plan
kaid auth login --provider chatgpt --new-account
kaid auth status --provider chatgpt
kaid auth select <saved-client-id> --provider chatgpt
kaid auth logout --provider chatgpt --account <saved-client-id>
kaid llm models
```

`kaid auth` accepts `--provider chatgpt` and `--account <client-id>`; `login` also accepts `--no-browser`, `--new-account` and `--enable-plan`. ChatGPT does not support `--device`. `--enable-plan` requests consent for a saved registration and cannot be combined with `--new-account`. The model list is account-specific; an explicit model is accepted even if the list omits it. This provider accepts `extra_body` only for `reasoning`, `text` and `prompt_cache_key`. See the [ChatGPT preview guide](chatgpt-preview.md) for account handling, permissions and restrictions.

## `kaid llm`

LLM utility commands. Three subcommands:

```text
kaid llm <sub-command>

Sub-commands:
  test         Send a test conversation to the configured LLM model
  providers    List all built-in LLM providers
  models       List current account-specific ChatGPT models
```

### `kaid llm test`

```text
kaid llm test
```

Resolves the LLM endpoint exactly the way `kaid review` does, sends a single
canned chat request from
[`internal/config/testconnection/task.json`](https://github.com/CHE3MZ/kaid/blob/master/internal/config/testconnection/task.json),
and prints:

```
Source: <which strategy was used>
URL:    <endpoint URL>
Model:  <effective model>
<the model's reply>
✓ Connection test successful
```

A non-zero exit means either the endpoint isn't fully configured or the
request failed (network / auth / model error). The error message tells you
which.

### `kaid llm providers`

```text
kaid llm providers
```

Lists every built-in LLM provider in a three-column table:

```
Built-in providers:
  NAME        PROTOCOL    BASE URL
  ----        --------    --------
  anthropic   anthropic   https://api.anthropic.com
  …
```

Followed by a hint to configure one interactively with `kaid config
provider` or non-interactively with `kaid config set provider <name>`.

## `kaid viewer`

```text
kaid viewer [flags]

Flags:
  --addr <address>   listen address (default: localhost:5483)
  --open <mode>      when to open the browser: auto, always, never (default: auto)

Examples:
  kaid viewer                     # start and open the browser
  kaid viewer --addr :3000        # bind to all interfaces on port 3000
  kaid viewer --open=never        # just print the URL
  kaid viewer --open=always       # force it when auto declines (piped output, WSL)
```

Starts an embedded HTTP server that reads
`~/.kaid/sessions/...` and renders past review sessions in a
browser-friendly UI. See [Session Viewer](viewer.md).

`--open=auto` skips the browser when stdout is not a terminal, when
`SSH_CONNECTION` is set with no display forwarded, or when Linux has neither
`DISPLAY` nor `WAYLAND_DISPLAY`; the reason is printed alongside the URL. Use
`--open=always` where auto declines but a browser is in fact reachable.

## `kaid version`

```text
kaid version
kaid --version
kaid -V
```

Prints the version stamped at build time, the short Git commit (when
present), the platform (`<GOOS>/<GOARCH>`), the build date (when present),
and the GitHub URL (`https://github.com/CHE3MZ/kaid`).


## kaid completion

Generate shell completion scripts for `kaid`, so command names, flags,
and arguments can be tab-completed in your shell.

### Bash

One-shot, current session only:

```bash
source <(kaid completion bash)
```

Persistent (Linux):

```bash
kaid completion bash > /etc/bash_completion.d/kaid
```

Persistent (macOS):

```bash
kaid completion bash > $(brew --prefix)/etc/bash_completion.d/kaid
```

### Zsh

If shell completion isn't already enabled in your environment, enable
it once:

```bash
echo "autoload -U compinit; compinit" >> ~/.zshrc
```

Then load completions persistently:

```bash
kaid completion zsh > "${fpath[1]}/_kaid"
```

Start a new shell for this to take effect.

### Fish

One-shot, current session only:

```bash
kaid completion fish | source
```

Persistent:

```bash
kaid completion fish > ~/.config/fish/completions/kaid.fish
```

### PowerShell

One-shot, current session only:

```powershell
kaid completion powershell | Out-String | Invoke-Expression
```

Persistent — generate the script once, then source it from your profile:

```powershell
kaid completion powershell > kaid.ps1
```

Add a line to your PowerShell profile that dot-sources `kaid.ps1`.


## Tips & gotchas

- `--audience agent` does **not** imply `--format json`, and `--format json`
  does not imply a quiet terminal. They control different things — quiet UI vs
  structured payload. `--format json` alone keeps progress visible on stderr;
  add `--audience agent` when you want it gone.
- `--background` is one of the highest-leverage flags for review quality —
  always pass the requirement / PR description when invoking from another
  agent.
- A file whose diff alone exceeds 80 % of `MAX_TOKENS` (`200000` by default)
  is dropped before the LLM is called. This is logged but does not fail
  the run.
- `MAX_TOKENS` caps the **prompt** only. The model's output is capped
  separately by `MAX_COMPLETION_TOKENS` (`16384`), so raising
  `--max-tokens` for a large-context model does not inflate output cost.
- The plan phase is **automatically skipped** when changed lines fall below
  both `PLAN_MODE_LINE_THRESHOLD` (`50`, applied to the largest single file
  in the group) and `PLAN_MODE_GROUP_LINE_THRESHOLD` (`100`, applied to the
  combined churn of a group with 2+ files).
- Files are bundled into semantic groups by one cheap metadata-only LLM
  call before review, so related changes (handler + service + test) are
  reviewed in a single conversation. Grouping failures fall back silently
  to one-file-per-group.
- `--effort high` is the cheapest quality lever when a review feels
  shallow; `--effort low` roughly halves cost versus the default when you
  just want a fast sanity pass.

## See Also

- [Quickstart](quickstart.md) - install and run your first review.
- [Configuration](configuration.md) - env vars and config keys behind the flags.
- [Review Rules](review-rules.md) - the `--rule` flag and rule resolution.

*[CI]: Continuous Integration
*[JSON]: JavaScript Object Notation
*[LLM]: Large Language Model
*[TUI]: Terminal User Interface
