# Guardrails de Processo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a evidência de workflow determinística, corrigir os guardrails quebrados de órfãos/documentos e reduzir falsos positivos de limpeza no pre-pr.

**Architecture:** Um parser puro de eventos será compartilhado pelo comando process:audit e pela rule-36. O pre-pr preparará apenas quatro artefatos gerados conhecidos antes das regras e os atualizará ao final; código e documentação editados continuam sujeitos à regra de limpeza. Regras existentes serão corrigidas na fonte, sem um segundo auditor paralelo para órfãos.

**Tech Stack:** Node.js 22 ESM, Vitest, scripts npm existentes, JSONL versionado, git CLI nativo.

## Global Constraints

- Persistência somente em docs/tracking/events.jsonl e public/kpi-data.json; nenhum serviço externo ou tabela nova.
- Preservar eventos históricos; não reclassificar nem apagar linhas existentes.
- Artefatos que o pre-pr pode preparar automaticamente: docs/RADAR.md, docs/tracking/events.jsonl, docs/tracking/quality.jsonl e public/kpi-data.json.
- Nenhum prompt, resposta, token, API key, password, secret ou credential pode entrar em eventos.
- Todo script novo em scripts/ deve ter atalho npm e teste unitário.
- TDD obrigatório: cada mudança de comportamento começa com teste RED observado e termina com teste GREEN observado.
- rule-14 deve aceitar entry points e testes; rule-17 deve validar somente o diff fornecido por getDiffFiles().
- A grade visual continua limitada a no máximo lg:grid-cols-2 para qualquer UI tocada nesta frente.

---

### Task 1: Corrigir os guardrails de baseline e indexar a documentação

**Files:**
- Modify: scripts/rules/rule-14-orphan-files.mjs
- Modify: scripts/rules/rule-17-new-docs-valid.mjs
- Modify: scripts/lib.mjs
- Modify: tests/unit/scripts-rules.test.ts
- Create: tests/unit/scripts-lib.test.ts
- Modify: tests/unit/scripts-session-start.test.ts
- Modify: tests/unit/scripts-pre-pr.test.ts
- Modify: docs/MAP.md
- Modify: docs/superpowers/specs/2026-08-03-process-guardrails-design.md
- Modify: docs/superpowers/specs/2026-08-03-llm-router-kpi-design.md
- Modify: docs/superpowers/specs/2026-08-03-project-sanitization-design.md

**Interfaces:**
- Consumes: getDiffFiles() from scripts/lib.mjs and the existing src import graph.
- Produces: rule-14 status 0 on the current source tree; rule-17-new-docs-valid status 0 with PRE_PR_MOCK_DIFF; all three approved specs listed in docs/MAP.md.

- [ ] **Step 1: Reproduce the RED baseline tests**

Run from the implementation worktree:

```bash
npm test -- tests/unit/scripts-rules.test.ts tests/unit/scripts-pre-pr.test.ts
node scripts/rules/rule-14-orphan-files.mjs
```

Expected before the fix: rule-14 reports legitimate relative-import files as orphaned; the rule-17 test reports the newly added specs as nine issues; the pre-pr fixture test fails because rule-17 reads git diff directly instead of PRE_PR_MOCK_DIFF.

- [ ] **Step 2: Add a focused regression assertion for relative imports**

In tests/unit/scripts-rules.test.ts, retain the existing positive rule-14 assertion and add a fixture-based assertion whose temporary tree contains src/components/Parent.tsx importing ./Child and src/components/Child.tsx. The rule must return status 0 for that tree. Keep the existing negative fixture that contains a truly unreferenced src file and require a nonzero status.

- [ ] **Step 3: Fix rule-14 at the path-resolution source**

In scripts/rules/rule-14-orphan-files.mjs, resolve relative imports from SRC plus the importer directory, not ROOT plus the importer directory. Preserve extensionless imports and index barrels by comparing normalized absolute paths for .ts, .tsx and /index variants. Keep @/ alias handling unchanged and continue skipping main.tsx, vite-env.d.ts and co-located tests.

- [ ] **Step 4: Prefer the remote base branch in shared diff discovery**

Add a pure regression test in tests/unit/scripts-lib.test.ts for a stale local main and newer origin/main resolver: inject a callback that returns different merge-base values for each ref. Export chooseMergeBase(baseBranch, resolveRef) from scripts/lib.mjs, make it try origin/main before local main, and have getDiffFiles use it. The result must prefer the remote value and fall back locally only when the remote ref is unavailable.

Run:

```bash
npm test -- tests/unit/scripts-lib.test.ts
```

Expected before the implementation: chooseMergeBase is unavailable; after it: the remote value is selected and the local fallback case passes without creating a temporary Git repository.

- [ ] **Step 5: Isolate Git fixture tests from commit-hook environment**

Remove GIT_DIR, GIT_WORK_TREE, GIT_INDEX_FILE, GIT_COMMON_DIR and GIT_PREFIX from child environments that create temporary repositories or run rules against them. Apply the same cleanup around scripts-session-start.test.ts, whose restoreHandoff uses git checkout. Run the full suite once with a temporary GIT_INDEX_FILE and assert the branch and HEAD remain the implementation branch/commit after the run.

- [ ] **Step 6: Make rule-17 consume the shared diff source**

In scripts/rules/rule-17-new-docs-valid.mjs, import getDiffFiles from scripts/lib.mjs and replace the direct origin/main git diff used to discover new markdown files with getDiffFiles(). Keep the existing exclusions for reports, archive, .pi, .opencode and fixtures. Resolve an internal link relative to the markdown file directory and normalize it with resolve; a root-relative docs/council path must not be treated as docs/superpowers/specs/docs/council.

- [ ] **Step 7: Make the approved docs valid for both validators**

List these exact filenames in the docs/superpowers/specs/ row of docs/MAP.md and list the council filename in the docs/council/ row:

- 2026-08-03-process-guardrails-design.md
- 2026-08-03-llm-router-kpi-design.md
- 2026-08-03-project-sanitization-design.md
- 2026-08-03-process-kpis-router-sanitizacao-veredito.md

Use a plain backtick reference to docs/council/2026-08-03-process-kpis-router-sanitizacao-veredito.md in each spec instead of a markdown link that the two validators resolve differently.

- [ ] **Step 8: Verify the focused GREEN set

```bash
npm test -- tests/unit/scripts-rules.test.ts tests/unit/scripts-pre-pr.test.ts
npm run verify-docs:strict
node scripts/rules/rule-14-orphan-files.mjs
PRE_PR_MOCK_DIFF='src/components/ui/button.tsx,docs/reports/2026-07-22/PR195-2026-07-22-animated-number-stale.html' PRE_PR_ONLY_RULES=true PRE_PR_ONLY_RULE='rule-08,rule-17' REPO_INFO_MOCK_BRANCH='feat/some-feat' REPO_INFO_MOCK_PR=195 REPO_INFO_MOCK_TODAY=2026-07-25 node scripts/pre-pr-check.mjs --strict
```

Expected: all focused tests exit 0, docs report zero issues, rule-14 reports no orphan files, and the mocked pre-pr output contains “relatório completo e válido ✅”.

- [ ] **Step 9: Commit the isolated guardrail repair

```bash
git add scripts/lib.mjs scripts/rules/rule-14-orphan-files.mjs scripts/rules/rule-17-new-docs-valid.mjs tests/unit/scripts-lib.test.ts tests/unit/scripts-rules.test.ts tests/unit/scripts-session-start.test.ts tests/unit/scripts-pre-pr.test.ts docs/MAP.md docs/superpowers/specs/2026-08-03-*-design.md
git commit -m "fix: corrigir guardrails de arquivos e docs"
```

---

### Task 2: Criar o parser e o validador de evidência de processo

**Files:**
- Create: scripts/lib/process-events.mjs
- Create: tests/unit/process-events.test.ts
- Create: scripts/lib/log-trim.mjs
- Create: tests/unit/log-trim.test.ts
- Modify: scripts/event-log.mjs
- Modify: scripts/quality-log.mjs
- Modify: scripts/lib/llm-router.mjs
- Modify: tests/unit/llm-router.test.ts
- Modify: scripts/kpi-report.mjs
- Modify: tests/kpi-report.test.ts

**Interfaces:**
- Consumes: JSONL plano atual e o formato legado com data.result/data.branch.
- Produces: validateRouterEvent(event) no contrato do router; parseProcessEvents(raw), validateProcessEvent(event), validateProcessEvents(events), summarizeProcessEvidence(events).

- [x] **Step 1: Write failing tests for parser and schema**

Create tests/unit/process-events.test.ts with cases for:

```ts
expect(parseProcessEvents('{"type":"pre-pr","timestamp":"2026-08-01T10:00:00Z","branch":"feat/a","errors":0}')).toHaveLength(1);
expect(() => parseProcessEvents('{broken}')).toThrow(/linha 1/i);
expect(validateProcessEvent({ type: "gate", timestamp: "2026-08-01T10:00:00Z", gate: "wrong" })).toContain("gate");
expect(validateProcessEvent({ type: "pre-pr", timestamp: "2026-08-01T10:00:00Z", errors: 0 })).toEqual([]);
expect(validateProcessEvent({ type: "custom", prompt: "segredo" })).toEqual(expect.arrayContaining([expect.stringMatching(/sensitive|prompt/i)]));
```

Add assertions that summarizeProcessEvidence counts invalid events, event types, and router resolutions without conclusions as unobserved. Run the file and observe RED because the module does not exist.

- [x] **Step 2: Implement the minimal pure module**

Define exported constants for valid process types and sensitive field names. parseProcessEvents must preserve event objects, skip blank lines, and throw an Error containing the 1-indexed line number for malformed JSON. validateProcessEvent returns string issues rather than throwing so the CLI can report multiple issues. Validate timestamp as a non-empty ISO-like string, type as a known type, and the type-specific required fields from the approved design. Delegate llm.route.resolved and llm.route.completed validation to the router validator exported by scripts/lib/llm-router.mjs.

- [x] **Step 3: Add compatibility tests to the existing KPI parser**

In tests/kpi-report.test.ts, add one event containing data.result and data.branch and assert computeMonthlyKPI keeps the current pass/fail behavior. Add a test that a valid router event is accepted by the process parser. Run:

```bash
npm test -- tests/unit/process-events.test.ts tests/kpi-report.test.ts
```

Expected: GREEN after the module and the compatibility import are implemented.

- [x] **Step 4: Wire the KPI parser through the shared validator without changing historical calculations**

In scripts/kpi-report.mjs, use parseProcessEvents for the JSONL input and retain computeMonthlyKPI’s existing six KPI fields. Do not make kpi-report rewrite or drop legacy events. The router KPI block is added by the router plan, not in this task.

- [ ] **Step 6: Preserve history in the event/quality trims (TWINS)**

scripts/event-log.mjs caps events.jsonl at 1000 lines and scripts/quality-log.mjs caps quality.jsonl at 500, deleting the oldest lines — history loss. Extract a pure splitAtLimit(lines, max) into scripts/lib/log-trim.mjs returning { kept, archived } without touching the filesystem, raise the caps to 20000/2000, and have both scripts append the archived overflow to docs/tracking/events-archive.jsonl and quality-archive.jsonl instead of deleting it. Add both archive paths to the pre-pr staging git add. Test RED first (a fixture with 3 lines and max 2 must return kept: 2, archived: 1), then GREEN, then confirm the real logs are below the new caps.

- [ ] **Step 7: Commit the event contract**

```bash
git add scripts/lib/process-events.mjs tests/unit/process-events.test.ts scripts/lib/log-trim.mjs tests/unit/log-trim.test.ts scripts/event-log.mjs scripts/quality-log.mjs scripts/lib/llm-router.mjs tests/unit/llm-router.test.ts scripts/kpi-report.mjs tests/kpi-report.test.ts
git commit -m "feat: validar evidencia de processo"
```

---

### Task 3: Expor process:audit e a rule-36 com a mesma implementação

**Files:**
- Create: scripts/process-audit.mjs
- Create: scripts/rules/rule-36-process-evidence.mjs
- Create: tests/unit/process-audit.test.ts
- Modify: package.json
- Modify: scripts/lib/process-events.mjs

**Interfaces:**
- Consumes: parseProcessEvents, validateProcessEvents and summarizeProcessEvidence.
- Produces: npm run process:audit, process-audit --check/--json, and a pre-pr rule that exits nonzero for invalid evidence.

- [x] **Step 1: Write RED tests for CLI behavior**

In tests/unit/process-audit.test.ts, execute the CLI against a temporary JSONL file selected by PROCESS_EVENTS_PATH. Assert that --json returns an object with total, invalid, byType and unobserved; assert that --check returns status 0 for a valid fixture, status 1 for malformed JSON, and status 1 when a prompt/token field leaks. A router resolution without a conclusion must produce an explicit unobserved count without failing the check until the router completion contract is active (aligned with the approved spec and Step 2). Assert that output contains paths/counts only and never the value of a prompt or token field.

- [ ] **Step 2: Implement the read-only CLI**

scripts/process-audit.mjs must read PROCESS_EVENTS_PATH when provided, otherwise docs/tracking/events.jsonl. Default output is a concise human summary. --json prints one JSON object. --check and --strict exit 1 when invalid events exist; unobserved router resolutions are reported but do not become invalid until the router plan’s completion contract is active. The default command never writes any file.

- [ ] **Step 3: Implement rule-36 as a thin adapter**

scripts/rules/rule-36-process-evidence.mjs must call the same validator/summary functions, print the first five sanitized issues, and exit 1 if invalid event count is nonzero. It must not parse JSONL independently. Add the npm shortcut process:audit in package.json; rule-16 must discover the new top-level script through that shortcut.

- [ ] **Step 4: Verify the shared path**

```bash
npm test -- tests/unit/process-audit.test.ts
npm run process:audit -- --json
PRE_PR_ONLY_RULES=true PRE_PR_ONLY_RULE=rule-36-process-evidence npm run pre-pr -- --no-report
```

Expected: the CLI and rule report the same counts; the rule passes on the current log after the five recorded pre-launch failures are validated as completed failed events.

- [ ] **Step 5: Commit the audit gate**

```bash
git add scripts/process-audit.mjs scripts/rules/rule-36-process-evidence.mjs tests/unit/process-audit.test.ts scripts/lib/process-events.mjs package.json
git commit -m "feat: adicionar auditoria de evidencia do workflow"
```

---

### Task 4: Corrigir staging dos artefatos gerados no pre-pr

**Files:**
- Create: scripts/lib/generated-artifacts.mjs
- Create: tests/unit/generated-artifacts.test.ts
- Modify: scripts/pre-pr-check.mjs

**Interfaces:**
- Consumes: repository root and the explicit generated artifact allowlist.
- Produces: stageGeneratedArtifacts(root), which runs git add only for the four generated paths.

- [ ] **Step 1: Write RED tests for the allowlist**

Assert that stageGeneratedArtifacts invokes git add with exactly docs/RADAR.md, docs/tracking/events.jsonl, docs/tracking/quality.jsonl and public/kpi-data.json when present, never with git add ., src, docs/superpowers or arbitrary markdown. Use a temporary git repository and inspect git status --short.

- [ ] **Step 2: Implement the helper**

Use existsSync and execFileSync with an argv array. Ignore absent generated files, propagate a nonzero git-add error, and return the list of staged candidates. Export the allowlist for the test.

- [ ] **Step 3: Call the helper at the correct boundaries**

In pre-pr-check.mjs, call stageGeneratedArtifacts before the rule loop and after the final event/KPI generation. Keep report staging separate and preserve the existing behavior that never stages source or user-authored docs. Do not hide rule-10 failures caused by actual unstaged source changes.

- [ ] **Step 4: Verify the regression**

```bash
npm test -- tests/unit/generated-artifacts.test.ts tests/unit/scripts-pre-pr.test.ts
npm run pre-pr -- --strict
```

Expected: the generated files do not create a false rule-10 failure; an intentionally unstaged src file still fails rule-10.

- [ ] **Step 5: Commit the pre-pr staging fix**

```bash
git add scripts/lib/generated-artifacts.mjs tests/unit/generated-artifacts.test.ts scripts/pre-pr-check.mjs
git commit -m "fix: preparar artefatos gerados antes do pre-pr"
```

---

### Task 5: Integrar documentação, hashes e verificação da frente

**Files:**
- Modify: docs/CONVENTIONS.md
- Modify: docs/MAP.md
- Modify: docs/handoff.md
- Modify: docs/tracking/events.jsonl
- Modify: docs/tracking/quality.jsonl
- Modify: public/kpi-data.json

**Interfaces:**
- Consumes: process:audit e rule-36 já verdes.
- Produces: documentação do comando, snapshot de KPI atualizado e evidência versionada sem campos sensíveis.

- [ ] **Step 1: Document the command and guardrail**

Add the exact commands npm run process:audit and npm run process:audit -- --check to the workflow/conventions section that documents validation scripts. Explain that the command is read-only and that unobserved router resolutions are distinct from invalid JSON.

- [ ] **Step 2: Run the focused and full checks**

```bash
npm test -- tests/unit/process-events.test.ts tests/unit/process-audit.test.ts tests/unit/generated-artifacts.test.ts tests/unit/scripts-rules.test.ts tests/unit/scripts-pre-pr.test.ts tests/kpi-report.test.ts
npm run typecheck
npm run verify-docs:strict
npm run process:audit -- --check
npm run rule:31
npm run rule:32
```

- [ ] **Step 3: Regenerate only the tracked KPI artifact**

Run npm run kpi, inspect that the JSON remains valid and contains no prompt/response/token-like key, then stage public/kpi-data.json and the tracking files generated by the command.

- [ ] **Step 4: Commit the integrated guardrails**

```bash
git add docs/CONVENTIONS.md docs/MAP.md docs/handoff.md docs/tracking/events.jsonl docs/tracking/quality.jsonl public/kpi-data.json
git commit -m "docs: registrar guardrails de evidencia"
```

- [ ] **Step 5: Record plan completion evidence**

Run npm run check:fast and npm run build. Record exact pass counts and any pre-existing lint warnings in the SDD ledger before starting the router plan.
