---
name: diff-miner
description: Use when reviewing or explaining a diff — dispatch an agent that reads only the diff and returns impact|risk|files rows instead of loading every changed file fully
---

# Diff Miner

## Overview

Explaining or reviewing a change usually means reading every touched file. A diff-miner subagent reads the diff (small, targeted) and returns only what matters about it.

**Core principle:** the diff is the truth — read the diff, not the files it touched.

## When to Use

- Pre-PR self-review: "does this diff do what the commit message says?"
- Explaining to the user what changed in a branch/session
- Risk triage before merge (which files changed, what could break)
- Deciding test coverage for a change

**Don't use** for: deep code review needing surrounding context (use `requesting-code-review`), or diffs smaller than ~50 lines (read it directly).

## Dispatch Template

```
Read the diff of <branch-or-range> (git diff main...HEAD --stat then the diff).
Return only:
- impact: 1-2 lines on what behavior changes
- risk: highest-risk file | why (≤3 rows)
- files: path | changed lines (≤5 rows)
No code blocks. No narrative.
```

## Pre-Dispatch Filtering

Always run `git diff main...HEAD --stat` first (tiny) to see scope before deciding to dispatch. If the stat shows ≤2 small files, read the diff directly — dispatch overhead outweighs savings.

For larger diffs, filter noise before dispatch:

```bash
git diff main...HEAD | grep -E '^[+-]' | grep -vE '^[+-]{3}' | head -100
```

## Common Mistakes

| Mistake | Cost | Fix |
|---------|------|-----|
| Reading every changed file fully | 10× the diff size | Read diff only |
| Dispatch for a 20-line fix | Overhead > saved | Do it directly |
| Miner re-explains the diff | Output echoes input | Demand impact/risk shape |
| Forgetting --stat gate | Blind dispatch on huge PRs | Stat first, always |
