# KPI de Ativação do Router LLM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar execução efetiva do router LLM e exibir mensalmente modelos usados, fallbacks, cobertura de conclusão e relação skill→modelo.

**Architecture:** O contrato de eventos permanece em scripts/lib/llm-router.mjs. Um agregador puro em scripts/lib/router-kpi.mjs correlaciona resoluções e conclusões por taskId e é chamado por scripts/kpi-report.mjs. O dashboard recebe apenas o bloco mensal agregado e renderiza uma seção isolada que tolera JSON legado.

**Tech Stack:** Node.js 22 ESM, JSONL, Vitest, React 18, TypeScript, Tailwind existente, componentes KPICard/KPITable.

## Global Constraints

- `llm.route.resolved` é decisão planejada; `llm.route.completed` é tentativa observada.
- `model` em conclusão é sempre o modelo efetivo; `resolvedModel` identifica o primário planejado quando disponível.
- `status` terminal permitido: completed, failed, cancelled ou blocked.
- `fallbackUsed` é booleano e só é verdadeiro quando o modelo efetivo diverge do primário resolvido.
- `skills` é lista normalizada, deduplicada e composta por identificadores minúsculos com letras, números e hífen.
- Nunca registrar prompt, input, output, response, token, tokens, apiKey, password, secret, credential ou credentials.
- `completed` no KPI conta uma tarefa terminal concluída uma vez; tentativas intermediárias continuam classificáveis para fallback.
- Persistência somente no JSONL local e no `public/kpi-data.json`; JSON legado sem llmRouter não pode quebrar o dashboard.
- Toda função nova deve ter teste unitário RED/GREEN; todo componente customizado deve ter teste.
- A UI não pode adicionar `grid-cols-3` ou superior; use no máximo `sm:grid-cols-2`/`lg:grid-cols-2`.

---

### Task 1: Estender o contrato seguro do router

**Files:**
- Modify: scripts/lib/llm-router.mjs
- Modify: tests/unit/llm-router.test.ts

**Interfaces:**
- Consumes: normalizeTaskContext, createResolvedEvent e createCompletedEvent existentes.
- Produces: normalização de skills e eventos com skills/resolvedModel/fallbackUsed/status terminal.

- [ ] **Step 1: Write the RED assertions**

Add tests that expect normalizeTaskContext to transform `skills: [" Brainstorming ", "test-driven-development"]` into `skills: ["brainstorming", "test-driven-development"]`, reject a duplicate, reject `skills: ["not valid"]` because it violates the identifier contract, and reject an empty/non-array value. Extend the resolved event expectation with `skills: []` for contexts without skills and with the normalized list for contexts with skills.

Add completion cases:

```ts
expect(createCompletedEvent({
  taskId: "P1-ROUTER", model: "model/fallback", resolvedModel: "model/primary",
  provider: "local", attempt: 2, status: "completed", fallbackUsed: true,
  skills: ["brainstorming"], durationMs: 12,
})).toMatchObject({ fallbackUsed: true, resolvedModel: "model/primary" });
expect(() => createCompletedEvent({ taskId: "x", model: "m", status: "success" })).toThrow(/status/i);
expect(() => createCompletedEvent({ taskId: "x", model: "m", resolvedModel: "m", status: "completed", fallbackUsed: true })).toThrow(/fallback/i);
```

Run the focused test and observe RED because the fields are currently unknown or ignored.

- [ ] **Step 2: Implement skill normalization**

Add a normalizeSkills helper that accepts undefined as [], requires an array otherwise, trims/lowercases each string, rejects empty values, duplicates and values outside `/^[a-z0-9][a-z0-9-]*$/`. Add skills to normalizeTaskContext’s returned object only when the input supplied the field, while createResolvedEvent emits the normalized list so every new resolution carries an explicit array.

- [ ] **Step 3: Implement completion validation**

Add resolvedModel, fallbackUsed and skills to EVENT_FIELDS. Validate status against the four terminal values, resolvedModel as an optional non-empty string, fallbackUsed as an optional boolean, and skills through the same helper. Reject fallbackUsed=true without resolvedModel, reject a true flag when model equals resolvedModel, and reject a false flag when model differs from resolvedModel. Preserve legacy events that omit the new optional fields.

- [ ] **Step 4: Verify GREEN and security assertions**

```bash
npm test -- tests/unit/llm-router.test.ts
```

The existing sensitive-field loop must continue failing every forbidden field, and the new event JSON must not contain any forbidden key.

- [ ] **Step 5: Commit the schema extension**

```bash
git add scripts/lib/llm-router.mjs tests/unit/llm-router.test.ts
git commit -m "feat: registrar skills e fallback efetivo do router"
```

---

### Task 2: Garantir a CLI de conclusão observável

**Files:**
- Modify: scripts/llm-route.mjs
- Modify: tests/unit/scripts-llm-route.test.ts
- Modify: docs/LLM-ROUTER.md

**Interfaces:**
- Consumes: createCompletedEvent’s extended input contract.
- Produces: `npm run llm:route -- complete --event '<json>'` that logs the sanitized effective model and fallback metadata.

- [ ] **Step 1: Add CLI RED coverage**

Extend scripts-llm-route.test.ts with a complete event containing resolvedModel, fallbackUsed and skills. Assert the JSON output includes these exact values and still omits sensitive keys. Add a failure case with status=success and assert exit status 1.

- [ ] **Step 2: Keep the CLI thin**

The CLI must continue parsing one JSON event and delegating validation to createCompletedEvent. Do not duplicate skill/status/fallback checks in scripts/llm-route.mjs. Preserve --no-log and EVENT_LOG_DISABLED behavior.

- [ ] **Step 3: Document dispatcher order**

Update docs/LLM-ROUTER.md with the four-step sequence: resolve, invoke the selected subagent/fallback, complete with the effective model/status/skills, and record pre-launch failures as failed. State that resolved alone is not execution.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/unit/scripts-llm-route.test.ts
npm run llm:route:validate
git add scripts/llm-route.mjs tests/unit/scripts-llm-route.test.ts docs/LLM-ROUTER.md
git commit -m "docs: explicitar conclusao efetiva do router"
```

---

### Task 3: Implementar o agregador mensal router-kpi

**Files:**
- Create: scripts/lib/router-kpi.mjs
- Create: tests/unit/router-kpi.test.ts
- Modify: scripts/kpi-report.mjs
- Modify: tests/kpi-report.test.ts

**Interfaces:**
- Consumes: arrays of resolved/completed event records.
- Produces: computeRouterKPI(events) returning `{ resolved, completed, failed, unobserved, fallbackUsed, completionRate, fallbackRate, models, skillsByModel }` with deterministic ordering.

- [ ] **Step 1: Write RED tests for the five routing outcomes**

Create fixtures for: primary completed, failed primary followed by completed fallback, terminal failure, resolution without completion, and two attempts with the same taskId. Assert:

```ts
expect(computeRouterKPI(primaryAndFallback)).toMatchObject({
  resolved: 1, completed: 1, failed: 0, unobserved: 0, fallbackUsed: 1,
  completionRate: 100, fallbackRate: 100,
});
expect(computeRouterKPI([{ type: "llm.route.resolved", taskId: "unseen", model: "m", timestamp: "2026-08-01T10:00:00Z" }]).unobserved).toBe(1);
```

Add assertions that models count the effective model and skillsByModel contains one row per skill/model pair. Run the test and observe RED because the module does not exist.

- [ ] **Step 2: Implement deterministic correlation**

Group resolutions and completions by taskId. Count raw resolution events in resolved. For each task, sort completion events by numeric attempt and timestamp, choose the last terminal event for completed/failed/model counts, and classify fallback from `fallbackUsed=true` or a proven effective model different from the resolved model and included in fallbackModels. A task with no completion increments unobserved. A completion without matching resolution is excluded from resolved rates and appears only in an internal unobserved-completion count that is not exposed in the public type.

Return null for completionRate when resolved=0 and fallbackRate when completed=0. Sort models by model name and skillsByModel by skill then model to make generated JSON stable.

- [ ] **Step 3: Wire monthly generation**

Add a JSDoc type for RouterMonthlyKPI, call computeRouterKPI(monthEvents) inside computeMonthlyKPI, and include the result under `llmRouter`. Keep all existing fields byte-for-byte equivalent for fixtures without router events except for the new zero-filled block. Update tests to assert zero-filled values for empty months and the full fallback fixture for August.

- [ ] **Step 4: Verify JSON generation**

```bash
npm test -- tests/unit/router-kpi.test.ts tests/kpi-report.test.ts
npm run kpi
node -e 'const d=require("./public/kpi-data.json"); console.log(d.months.at(-1).llmRouter)'
```

Expected: deterministic block exists in every generated month and contains no sensitive fields.

- [ ] **Step 5: Commit the aggregator**

```bash
git add scripts/lib/router-kpi.mjs tests/unit/router-kpi.test.ts scripts/kpi-report.mjs tests/kpi-report.test.ts public/kpi-data.json
git commit -m "feat: computar KPIs de execucao do router"
```

---

### Task 4: Renderizar o bloco Router KPI no dashboard

**Files:**
- Create: src/components/LLMRouterKPISection.tsx
- Create: tests/components/LLMRouterKPISection.test.tsx
- Modify: src/components/KPIDashboard.tsx
- Modify: tests/components/KPIDashboard.test.tsx

**Interfaces:**
- Consumes: RouterMonthlyKPI from the JSON month and KPICard/KPITable existing components.
- Produces: a tested section with activation, fallback, effective-model and skill/model information.

- [ ] **Step 1: Write component RED tests**

Create a fixture with resolved=4, completed=3, failed=1, unobserved=1, fallbackUsed=1, completionRate=75, fallbackRate=33.3, two models and two skill/model rows. Assert the section renders “Ativações do Router”, “Uso de Fallback”, effective model names, skill names, and “1 rota sem conclusão observada”. Add a second test with zero values asserting “Sem dados do router neste período”. Run and observe RED because the component does not exist.

- [ ] **Step 2: Implement the section with existing primitives**

Render two KPICard instances and two KPITable instances. Format percentages with `pt-BR`-safe string values but do not round again. For null rates show “—”. Use `sm:grid-cols-2` or `lg:grid-cols-2`; do not introduce a three-column grid. Keep table rows strings so KPITable’s existing contract remains unchanged.

- [ ] **Step 3: Extend dashboard types and legacy behavior**

Add the RouterMonthlyKPI interface and optional `llmRouter?: RouterMonthlyKPI` to MonthlyKPI. Render the section with the current month’s block; when absent, pass a zero/empty legacy state that displays the explicit no-data message. Do not alter loading/error/fetch behavior in pages/KPI.tsx.

- [ ] **Step 4: Add dashboard integration assertions**

Add llmRouter to the existing mock month and assert the router card/table text appears. Keep the existing title, timestamp, selector and prior KPI value assertions.

- [ ] **Step 5: Verify UI and commit**

```bash
npm test -- tests/components/LLMRouterKPISection.test.tsx tests/components/KPIDashboard.test.tsx tests/pages/KPI.test.tsx
npm run typecheck
npm run lint
npm run format:check
git add src/components/LLMRouterKPISection.tsx tests/components/LLMRouterKPISection.test.tsx src/components/KPIDashboard.tsx tests/components/KPIDashboard.test.tsx
git commit -m "feat: exibir KPI de ativacao do router"
```

---

### Task 5: Integrar eventos reais do dispatcher e fechar verificação

**Files:**
- Modify: scripts/llm-route.mjs
- Modify: scripts/event-log.mjs
- Modify: docs/LLM-ROUTER.md
- Modify: docs/handoff.md
- Modify: docs/tracking/events.jsonl
- Modify: docs/tracking/quality.jsonl
- Modify: public/kpi-data.json

**Interfaces:**
- Consumes: schema, CLI and aggregator from Tasks 1–4.
- Produces: current-session evidence where every attempted subagent has a terminal completion event, including pre-launch failures, and the dashboard JSON is regenerated.

- [ ] **Step 1: Add an integration fixture for resolved/completed pairing**

Use EVENT_LOG_DISABLED for unit tests and a temporary tracking path for the integration test. Run resolve with a known context, then complete with the returned primary model and skills; assert two JSONL records share taskId and the KPI reports one completed route. Repeat with a fallback model and fallbackUsed=true; assert fallbackUsed=1.

- [ ] **Step 2: Keep event-log’s allowlist and test isolation**

Confirm llm.route.resolved and llm.route.completed remain valid event types, VITEST/EVENT_LOG_DISABLED prevents writes, and unknown sensitive fields cannot be passed through the CLI. If metadata parsing fails, return a controlled nonzero exit without partial writes.

- [ ] **Step 3: Regenerate and inspect the public artifact**

Run npm run kpi, inspect all six months for llmRouter, and assert with a JSON scan that forbidden key names are absent. Record the current month’s activation/completion/fallback/unobserved counts in the handoff.

- [ ] **Step 4: Run the full router verification**

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
npm run verify-docs:strict
npm run llm:route:validate
npm run kpi
npm run build
```

- [ ] **Step 5: Commit the integrated evidence**

```bash
git add scripts/llm-route.mjs scripts/event-log.mjs docs/LLM-ROUTER.md docs/handoff.md docs/tracking/events.jsonl docs/tracking/quality.jsonl public/kpi-data.json
git commit -m "feat: fechar telemetria de execucao do router"
```
