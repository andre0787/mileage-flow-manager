---
name: test-triage
description: Use when tests fail — dispatch an agent that runs only the failing test and returns cause|fix|evidence in 2-3 lines instead of pulling whole logs and files into context
---

# Test Triage

## Overview

Debugging a failing test classically means running the suite, copying logs, and reading the failing file(s) — thousands of tokens. A triage agent runs only the failing test in its own context and returns the cause and fix.

**Core principle:** reproduce the failure once, return cause + fix + evidence — never the log.

## When to Use

- One or a few failing tests (not full-suite cascades)
- Flaky tests (run twice to confirm)
- CI failures where you only have the failure summary
- Before escalating to systematic-debugging for deep root causes

**Don't use** for: cascading failures across many files (dispatch one per area via `dispatching-parallel-agents`), or failures needing interactive browser debugging.

## Dispatch Template

```
Run only: <exact test command> (e.g. npx vitest run tests/x.test.ts -t 'name').
Return only:
- cause: root cause in 1 line
- fix: suggested fix in 1-2 lines (file | change)
- evidence: the 1 assertion/error line that proves it
No full logs. No stack dump. No test re-run output.
```

## Flake Discipline

Always run the failing test **twice** in one dispatch before calling it a real bug:

```
Run the test twice. If it fails both times: cause|fix|evidence.
If it passes once: report "flake" + the 1 flaky line.
```

## Common Mistakes

| Mistake | Cost | Fix |
|---------|------|-----|
| Agent pastes full error log | 100+ lines in context | "1 assertion/error line only" |
| Running the whole suite for one failure | Minutes + massive output | Run only the failing test |
| Agent reads the whole source file | File bloat | Bind to function/line range |
| Declaring bug on single flake | Wrong triage | Run twice, always |
| Skipping the run entirely ("obvious from the error") | Guess fixes | Reproduce first |
