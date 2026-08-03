# Sanitização Segura do Projeto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auditar o repositório inteiro e remover somente redundâncias, órfãos e artefatos gerados comprovados, sem apagar histórico nem quebrar CI/deploy.

**Architecture:** O comando project:audit coordena as regras existentes e um helper puro para artefatos rastreados. O modo padrão é read-only; --json produz inventário sanitizado e --strict falha em achados críticos. Aplicações destrutivas são commits explícitos e allowlisted, começando pelo relatório Playwright indevidamente rastreado.

**Tech Stack:** Node.js 22 ESM, git CLI, npm audit, Vitest, regras scripts/rules existentes, .gitignore.

## Global Constraints

- Auditoria padrão não escreve nem remove arquivos; não existe flag genérica --fix.
- rule-14/15/16/18/23/31/32 continuam sendo a fonte de seus próprios domínios; o auditor não duplica seus algoritmos.
- Preservar docs/archive, docs/reports, docs/tracking, migrations, fixtures e entry points legítimos.
- Relatório Playwright só será removido depois de verificar dependências e manter o upload do CI funcional.
- Todo comando novo em scripts/ terá atalho npm, teste e documentação.
- A saída JSON contém caminhos relativos/categorias/contagens, nunca conteúdo de arquivo sensível.
- Vulnerabilidade high de react-router não será alterada via npm audit fix --force; upgrade/downgrade exige tarefa e testes de compatibilidade.
- TDD obrigatório para o scanner e para qualquer mudança de comportamento.
- A UI não pode receber grid-cols-3 ou maior nesta frente.

---

### Task 1: Criar o núcleo puro de classificação de auditoria

**Files:**
- Create: scripts/lib/project-audit.mjs
- Create: tests/unit/project-audit.test.ts
**Interfaces:**
- Consumes: lista de caminhos rastreados e regras de allowlist.
- Produces: classifyTrackedArtifacts(paths), sortAuditFindings(findings) e tipos de finding `{ path, category, severity, reason }`.

- [x] **Step 1: Write RED tests with repository fixtures**

In tests/unit/project-audit.test.ts, assert:

```ts
expect(classifyTrackedArtifacts(["playwright-report/index.html"])).toEqual([
  expect.objectContaining({ path: "playwright-report/index.html", category: "generated", severity: "critical" }),
]);
expect(classifyTrackedArtifacts(["docs/archive/old.md", "supabase/migrations/001.sql", "docs/tracking/events.jsonl"])).toEqual(expect.arrayContaining([
  expect.objectContaining({ category: "historical" }),
  expect.objectContaining({ category: "allowlisted" }),
]));
```

Add tests for dist/test-results ignored paths, source paths, and deterministic sorting. Run and observe RED because the module does not exist.

- [x] **Step 2: Implement explicit classification**

Use ordered predicates: historical/operational allowlists first, known generated directories second, source/docs/script paths last. Treat a generated tracked file as critical only when it is outside the approved operational allowlist. Return relative normalized POSIX paths and do not read file contents.

- [x] **Step 3: Keep the helper isolated until the CLI exists**

Do not modify package.json in this task. The npm entry point is added together with scripts/project-audit.mjs in Task 2, so no committed command points at a missing script.

- [x] **Step 4: Verify and commit the pure helper**

```bash
npm test -- tests/unit/project-audit.test.ts
# Expected: GREEN after the helper implementation.
git add scripts/lib/project-audit.mjs tests/unit/project-audit.test.ts package.json
git commit -m "feat: classificar achados de sanitizacao"
```

---

### Task 2: Implementar project:audit read-only e integrar regras existentes

**Files:**
- Create: scripts/project-audit.mjs
- Create: tests/unit/project-audit-cli.test.ts
- Modify: scripts/lib/project-audit.mjs
- Modify: docs/CONVENTIONS.md

**Interfaces:**
- Consumes: classifyTrackedArtifacts and the scripts/rules rule files.
- Produces: project-audit --json, project-audit --strict and human-readable default output.

- [x] **Step 1: Write RED CLI tests**

Create temporary git roots with a minimal tracked artifact and execute scripts/project-audit.mjs using MOCK_ROOT. Assert default mode does not create files, --json parses as `{ generatedAt, checks, findings }`, and --strict exits 1 for a critical generated artifact. Assert the JSON includes only relative path/category/severity/reason and never file contents.

- [x] **Step 2: Implement rule orchestration without algorithm duplication**

The CLI must run the existing rule scripts 14, 15, 16, 18, 23, 31 and 32 as child processes with MOCK_ROOT, capture exit status and a short sanitized summary, then call classifyTrackedArtifacts on `git ls-files`. A rule failure becomes a check result; it is not silently converted to a pass. Existing rule thresholds remain authoritative.

- [x] **Step 3: Implement modes and exit semantics**

Default prints grouped checks/findings and exits 0 unless the command itself cannot inspect the repository. --json prints one JSON document and no ANSI decoration. --strict exits 1 for any critical finding or failed rule check, 0 for warnings/allowlisted items only. No mode writes reports or changes git state.

- [x] **Step 4: Document usage and limitations**

Add a Portuguese section in docs/CONVENTIONS.md with these commands and explain that orphan detection respects entry points/fixtures, duplicate detection uses rule-15’s threshold, and security audit is separate from structural sanitization.

- [x] **Step 5: Verify and commit**

```bash
npm test -- tests/unit/project-audit.test.ts tests/unit/project-audit-cli.test.ts
npm run project:audit -- --json
npm run project:audit -- --strict
npm run rule:31
npm run rule:32
git add scripts/project-audit.mjs tests/unit/project-audit-cli.test.ts scripts/lib/project-audit.mjs docs/CONVENTIONS.md package.json
git commit -m "feat: auditar estrutura do projeto sem mutacao"
```

Expected baseline after rule-14 repair: no critical orphan/duplicate/script/coverage finding; any warning must be named in the report before proceeding.

---

### Task 3: Auditar referências, sujeira e duplicidade com evidência

**Files:**
- Modify: scripts/project-audit.mjs
- Modify: tests/unit/project-audit-cli.test.ts
- Modify: docs/MAP.md
- Create: audit snapshot markdown under docs/audits/ with basename 2026-08-03-project-audit

**Interfaces:**
- Consumes: check results from Tasks 1–2, verify-docs:strict and tracked-file inventory.
- Produces: one human-readable audit snapshot that classifies every current finding before any removal.

- [x] **Step 1: Add RED assertions for full inventory**

Assert the CLI includes named checks for orphan source, duplicate components, script shortcuts, docs duplicates, skills, library/component tests, generated tracked artifacts and stale docs references. Assert an ignored local tests/fluxo-relatorio.md is not reported as a tracked finding and docs/archive is historical.

- [x] **Step 2: Add non-destructive reference checks**

Use `git ls-files` for tracked candidates and invoke npm run verify-docs:strict with its exit/output captured. Do not infer that a file is orphaned from import absence when its category is an entry point, fixture, migration, historical doc or script/lib module. Report stale references as warning/critical based on the existing verifier result.

- [x] **Step 3: Generate the reviewed audit document**

Run project:audit --json, then write the audit snapshot named in this task’s Files section with date, command, commit, check table, findings, allowlist decisions and explicit “no automatic deletion” statement. Add the filename to docs/MAP.md so rule-17 accepts it. The document must contain paths and counts only, not file contents.

- [x] **Step 4: Run the audit twice**

```bash
npm run project:audit -- --json > /tmp/project-audit-1.json
npm run project:audit -- --json > /tmp/project-audit-2.json
npm run project:audit -- --strict
npm run verify-docs:strict
node -e 'const fs=require("fs"); const a=JSON.parse(fs.readFileSync("/tmp/project-audit-1.json","utf8")); const b=JSON.parse(fs.readFileSync("/tmp/project-audit-2.json","utf8")); if(JSON.stringify(a.checks)!==JSON.stringify(b.checks) || JSON.stringify(a.findings)!==JSON.stringify(b.findings)) process.exit(1)'
```

The JSON’s check ordering and finding ordering must be deterministic; the strict result is the evidence gate before sanitization.

- [x] **Step 5: Commit the audit snapshot**

```bash
git add scripts/project-audit.mjs tests/unit/project-audit-cli.test.ts docs/MAP.md docs/audits/2026-08-03-project-audit.md
git commit -m "docs: registrar auditoria estrutural do projeto"
```

---

### Task 4: Remover o relatório Playwright versionado indevidamente

**Files:**
- Modify: .gitignore
- Delete: playwright-report/index.html
- Modify: .github/workflows/ci.yml
- Modify: tests/unit/project-audit.test.ts

**Interfaces:**
- Consumes: the audit finding for the tracked generated artifact.
- Produces: ignored local Playwright reports and unchanged CI artifact upload.

- [x] **Step 1: Write the pre-change regression check**

Add a test that fails when `playwright-report/index.html` is classified as critical while tracked and passes when the path is absent/ignored. Before editing, run `git ls-files playwright-report` and confirm the exact tracked file and `rg -n "playwright-report|test-results" .github playwright.config.ts package.json` dependencies.

- [x] **Step 2: Apply the minimal sanitization**

Add `playwright-report/` to .gitignore. Delete only the tracked index file from the repository. Do not alter Playwright’s reporter configuration or CI upload paths unless the evidence command proves they reference the deleted committed file rather than the generated directory.

- [x] **Step 3: Verify local generation and CI references**

```bash
npm run project:audit -- --json
git ls-files playwright-report
npm run test:e2e:smoke
npm run project:audit -- --strict
```

Expected: no tracked playwright-report path, smoke report generation still works, and strict audit has no critical generated-artifact finding.

- [x] **Step 4: Commit the cleanup**

```bash
git add .gitignore .github/workflows/ci.yml tests/unit/project-audit.test.ts
git rm playwright-report/index.html
git commit -m "chore: remover relatorio playwright versionado"
```

---

### Task 5: Investigar a vulnerabilidade react-router sem mudança breaking silenciosa

**Files:**
- Modify: docs/RADAR.md
- Modify: docs/handoff.md
- Modify: package.json only if a compatible patched version is proven
- Modify: package-lock.json only if package.json changes
- Create: tests/unit/router-dependency-policy.test.ts only if dependency changes

**Interfaces:**
- Consumes: npm audit --omit=dev --json, npm ls react-router react-router-dom and compatibility tests.
- Produces: either a tested dependency patch or a documented release blocker with no false PASS.

- [x] **Step 1: Capture the exact advisory and dependency graph**

```bash
npm audit --omit=dev --json > /tmp/npm-audit.json
npm ls react-router react-router-dom
npm view react-router-dom versions --json
```

Record affected/fixed ranges and whether the application uses RSC APIs. Do not run npm audit fix --force.

- [x] **Step 2: Test the smallest compatible option**

If npm reports a semver-compatible patched version, update only that dependency, run npm install, and add a test that builds and mounts the BrowserRouter app. If the only candidate is a downgrade/breaking change, do not modify dependencies; update docs/RADAR.md and handoff with advisory, tested command, impact and explicit blocker status.

- [x] **Step 3: Verify the chosen outcome**

```bash
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

A remaining high advisory is reported as unresolved; it cannot be hidden by changing the scanner.

- [x] **Step 4: Commit only evidence-backed changes**

```bash
git add docs/RADAR.md docs/handoff.md
# Add package.json, package-lock.json and the dependency test only when the compatible patch path changed them.
git add package.json package-lock.json tests/unit/router-dependency-policy.test.ts 2>/dev/null || true
git commit -m "chore: registrar politica de dependencia do router"
```

---

### Task 6: Verificação final da sanitização

**Files:**
- Modify: docs/handoff.md
- Modify: docs/tracking/events.jsonl
- Modify: docs/tracking/quality.jsonl
- Modify: public/kpi-data.json

**Interfaces:**
- Consumes: all audit/check commands and cleanup commits.
- Produces: final evidence for pre-pr and production readiness.

- [x] **Step 1: Run the structural and quality battery**

```bash
npm run project:audit -- --strict
npm run process:audit -- --check
npm run verify-docs:strict
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run budget:check
```

- [x] **Step 2: Confirm no forbidden artifacts or sensitive KPI keys**

```bash
git ls-files | grep -E '(^|/)(playwright-report|test-results|dist)/' || true
node -e 'const fs=require("fs"); const s=fs.readFileSync("public/kpi-data.json","utf8"); if(/prompt|response|output|token|apiKey|password|secret/i.test(s)) process.exit(1); console.log("kpi sanitized")'
```

- [x] **Step 3: Regenerate evidence and inspect the diff**

Run npm run kpi and npm run pre-pr -- --strict, inspect the generated report for all required sections, and ensure only expected generated files are staged. Record the exact command results in docs/handoff.md.

- [x] **Step 4: Commit final evidence**

```bash
git add docs/handoff.md docs/tracking/events.jsonl docs/tracking/quality.jsonl public/kpi-data.json docs/reports/
git commit -m "chore: fechar evidencia de sanitizacao"
```

- [x] **Step 5: Stop before outward-facing actions**

Do not push, merge, create a PR or deploy in this plan. Those actions require the AUTH gate and a separate final review with fresh verification evidence.
