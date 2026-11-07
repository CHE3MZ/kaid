---
title: kaid
hide:
  - navigation
  - toc
---

# :material-robot-happy-outline: kaid

![kaid logo](assets/icon.png){ align=right width="96" }

**AI-powered code review that fits the way you already work.** kaid picks the
right files, applies your rules, reviews related changes together, and returns
findings you can act on - from your terminal, your editor, or CI.

[Quickstart :material-rocket-launch:](quickstart.md){ .md-button .md-button--primary }
[Installation :material-download:](installation.md){ .md-button }
[View on GitHub :fontawesome-brands-github:](https://github.com/CHE3MZ/kaid){ .md-button }

<div class="grid cards" markdown>

-   :material-rocket-launch-outline:{ .lg .middle } **Review in minutes**

    ---

    Install the CLI, connect any OpenAI- or Anthropic-compatible endpoint, and
    run your first review against a workspace, a branch range, or a single
    commit.

    [:octicons-arrow-right-24: Quickstart](quickstart.md)

-   :material-source-branch:{ .lg .middle } **Context-aware findings**

    ---

    Related files are grouped into one conversation, so the reviewer sees a
    handler, its service, and its tests together instead of guessing from a
    single hunk.

    [:octicons-arrow-right-24: Architecture](architecture.md)

-   :material-shield-search:{ .lg .middle } **Your rules, enforced**

    ---

    Layer project, global, and system rules. Exclude generated code. Merge
    house standards with built-in language guidance on a per-path basis.

    [:octicons-arrow-right-24: Review rules](review-rules.md)

-   :material-console:{ .lg .middle } **Built for automation**

    ---

    Emit JSON, suppress progress output, and post findings back to GitHub or
    GitLab. Run it locally, in a pipeline, or through an agent integration.

    [:octicons-arrow-right-24: CI/CD recipes](integrations/ci.md)

</div>

## Why kaid?

- :material-filter-variant: **Filters before it spends tokens.** Binaries,
  ignored paths, unsupported extensions, deleted files, and oversized diffs
  never reach the model.
- :material-format-list-checks: **Resolves a rule per file.** The four-layer
  chain gives you predictable scope without a separate configuration service.
- :material-brain: **Keeps the review coherent.** Semantic grouping and a
  shared per-group conversation let the model reason across related changes.
- :material-file-document-outline: **Leaves an audit trail.** Every run writes
  a JSONL transcript you can replay in the built-in session viewer.
- :material-robot-outline: **Meets you where you work.** Use a hosted model,
  a local gateway, a coding agent's subscription, or MCP tools.

## How it works

```text
diff -> filter & rules -> semantic groups -> review rounds -> comments
```

The pipeline is deterministic where it matters: file selection and rule
resolution are plain Go code, while the model only sees the diffs and context
you have allowed. ==Nothing is reviewed twice by accident, and nothing is sent
without a reason.==

| You want to... | Start with |
|---|---|
| Review local changes before committing | `kaid review` |
| Review a feature branch in CI | `kaid review --from main --to feature` |
| Replay what the model saw | `kaid viewer` |
| Reuse an existing coding agent | [Delegation mode](integrations/delegate.md) |
| Add repository knowledge | [MCP servers](mcp.md) |

## Get the CLI

=== "macOS / Linux"

    ```bash
    curl -fsSL https://raw.githubusercontent.com/CHE3MZ/kaid/master/scripts/install.sh | sh
    ```

=== "Windows"

    ```powershell
    irm https://raw.githubusercontent.com/CHE3MZ/kaid/master/scripts/install.ps1 | iex
    ```

Then verify the binary and configure a model:

```bash
kaid version
kaid config provider
kaid llm test
```

!!! tip "Already have an endpoint?"

    Skip the interactive setup and write the configuration directly with
    `kaid config set`, or point kaid at your existing `ANTHROPIC_*` / `KAID_LLM_*`
    environment variables. See [Configuration](configuration.md).

AI review is a second pair of eyes, not a replacement for tests or human
judgement.[^review-note]

[^review-note]: Model output can be wrong in both directions - it may miss a
    real defect or flag code that is correct. Treat findings as leads and keep
    your normal review process in place. See the
    [FAQ](faq.md#does-kaid-send-my-code-anywhere) for what leaves your machine.
