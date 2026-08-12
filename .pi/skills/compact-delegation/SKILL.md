---
name: compact-delegation
description: Use when delegating any task to a subagent — the universal contract that minimizes tokens per dispatch (minimal context, compact structured return, no history inheritance)
---

# Compact Delegation

## Overview

Every subagent dispatch has a fixed overhead (~4-5K tokens system + tools). The only lever you control is what you **pass in** and what they **return**. This contract minimizes both.

**Core principle:** pass only the minimum context needed; demand a structured return of key fields only — never full files, logs, or reasoning.

## When to Use

- Dispatching ANY subagent (`scout`, `researcher`, `reviewer`, `worker`, `delegate`, `oracle`)
- Before reading a file, searching, or running tests — ask: "can a subagent do this and return 5 lines?"
- When a subagent would otherwise echo file contents or explain its reasoning path

**Don't use** for: single quick `read_files`/`glob` calls the coordinator does directly (dispatch overhead > saved tokens).

## Contract — Input (what you pass)

| Do | Don't |
|----|-------|
| Task in 1-3 sentences with explicit output shape | Paste session history or prior turns |
| Exact paths/patterns/commands to run | Send whole conversation "for context" |
| The exact return format required | Boilerplate "you are an expert" preambles |
| Named files + line ranges when relevant | Summarize docs the subagent can read itself |

The subagent gets a clean context: system prompt + your compact instruction only. **Never inherit your session's context or history** — construct exactly what they need.

## Contract — Output (what you demand)

Require ONE of these shapes in your prompt; the subagent must not add more:

- **Research/scout:** `file | line | finding` (max 5 rows) — no code echo
- **Failure triage:** `cause | fix | evidence` (2-3 lines total)
- **Review:** `verdict | issues (≤3) | must-fix?` — no restated spec
- **Diff analysis:** `impact | risk | files (≤5)` — no re-pasted diff

Add the exact sentence: **"Return only: <fields>. No code blocks unless explicitly requested. No reasoning narrative."**

## Turn Budgets

- Cap exploration subagents at ~15-20 tool turns (thrashing = repeated reads = waste)
- Prefer a single targeted pass over iterative refinement
- If a subagent is looping, abort and re-dispatch with tighter scope

## Routing

- Mechanical subagents (search, triage, diff) → **efficient** profile (cheap model)
- Use `npm run llm:route -- resolve --context '{"category":"...","capability":"..."}'` — never pick a model inline for routed tasks
- Only reasoning/review-heavy work earns the expensive model

## Common Mistakes

| Mistake | Cost | Fix |
|---------|------|-----|
| "Here's the conversation so far" | Whole history in every dispatch | Pass 3-sentence task only |
| Subagent returns code it read | Full files re-enter your context | Demand field-only return |
| Reading whole files when a grep suffices | 100s of lines per read | `code_searcher`/`grep` with `-A/-B` |
| Re-dispatching with same scope after flake | Duplicate overhead | Tighten scope or route cheaper |
| Dispatching for trivial lookups | Overhead > saved tokens | Do it yourself |
