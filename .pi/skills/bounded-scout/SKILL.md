---
name: bounded-scout
description: Use when exploring code with a narrow scope — dispatch a scout subagent bound to specific files/dirs that returns only file|line|finding rows instead of reading whole files into context
---

# Bounded Scout

## Overview

Most exploration reads whole files into the coordinator's context, then discards most of it. A bounded scout subagent explores the narrow area in its own context and returns only the relevant rows.

**Core principle:** delegate exploration to an isolated scout that reports `file | line | finding` — you never see the files, only the hits.

## When to Use

- Locating where a symbol is defined/used across a module
- Checking whether a pattern/antipattern exists in an area (TWINS checks)
- Auditing a component/page for a specific concern (dark mode, accessibility, error states)
- Answering "what does this area do" before modifying it

**Don't use** for: searching the whole repo (`code_searcher` handles that cheaper), or reading 1-2 files the coordinator needs in full.

## Dispatch Template

```
Scout <dir-or-files> for <concern>.
Return only rows: file | line | finding (max 8 rows).
No code blocks. No narrative. If nothing found: "none".
```

### Examples

```
Scout src/components/SaleForm.tsx + EntryForm.tsx for mutation-without-inverse patterns.
Return only: file | line | finding (max 8 rows). No code. If none: "none".
```

```
Scout src/pages for hardcoded pt-BR strings outside i18n t().
Return only: file | line | finding (max 8 rows). No code. If none: "none".
```

## TWINS Integration

For TWINS checks (rule-34), dispatch ONE scout per area in parallel, all with the same concern. Each returns hits only — you aggregate the `found N locais` count without ever loading the files.

## Common Mistakes

| Mistake | Cost | Fix |
|---------|------|-----|
| Scout returns matching code lines | Code bloat re-enters context | "No code blocks" in prompt |
| Unbounded scope ("look at everything") | Full repo exploration | Bind to explicit files/dirs |
| Re-reading files after scout report | Double cost | Trust the structured rows; read only the 1-2 files that need full context |
| No row cap | 50-row dump | `max 8 rows` hard cap in template |
