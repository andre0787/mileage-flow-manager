# Veredito — Agent Execution Core (spec v5: papéis de execução)

**Tema:** Implementar os itens de código da **Agent Execution Spec v5** (`02-Agent-Execution-Spec-MilesControl-v5.md`) que ainda não existem: resultado estruturado de subagente (§14), Graph/Domain/Test Scouts (§15-17), Architect (§18), Final Validator (§21/§26), sanitização de secrets (§12) e graph freshness (§22).
**Data:** 2026-08-15
**Sessão:** feature — Agent Execution Core
**Base:** `src/ai/` (PRs #413/#417/#421 — contratos core, orchestration, telemetry v5), CRG CLI, workflow do pre-pr.

## Gap analysis (spec vs. código existente)

| Spec                           | Existe?    | Onde                                           |
| ------------------------------ | ---------- | ---------------------------------------------- |
| §2 adapter no core             | ✅         | `src/ai/adapters/`                             |
| §6 ContextPacket               | ✅         | `src/ai/core/context-packet.ts`                |
| §8 paralelismo writeScope      | ✅         | `src/ai/core/task-contract.ts` (conflictsWith) |
| §9-10 routing/degradacão       | ✅         | planner/scheduler                              |
| §11 telemetria                 | ✅         | envelope.ts + persist.ts (P7)                  |
| §13 budget                     | ✅         | `src/ai/orchestration/budget.ts`               |
| §14 SubagentResult estruturado | ❌         | —                                              |
| §15 Graph Scout                | ❌         | —                                              |
| §16 Domain Scout               | ❌         | —                                              |
| §17 Test Scout                 | ❌         | —                                              |
| §18 Architect (findings→plano) | ⚠️ parcial | planner (task→plan, sem findings de scouts)    |
| §21/§26 Final Validator        | ❌         | pre-pr cobre parte, sem check unificado        |
| §12 sanitização de secrets     | ❌         | —                                              |
| §22 graph freshness            | ❌         | CRG tem update, sem check no fluxo             |

## Advisors

### Advisor: The Contrarian

**Análise:** Riscos: (1) scouts que "consultam o grafo" não podem depender do CRG instalado — fail-open sempre (CRG ausente → resultado vazio com available:false, nunca crash); (2) o `impact --json` do CRG tem sintaxe própria e mudou — os scouts devem tratar a saída como não-confiável e normalizar; (3) sanitização de secrets não pode ter falso-negativo que vaze CPF — regex de CPF + chaves + senhas com teste negativo.
**Veredito:** Faça — fail-open + normalização defensiva + testes de sanitização.

### Advisor: First Principles Thinker

**Análise:** A spec §14 define o contrato de retorno do subagente (status/summary/findings/files/risks/recommendations/confidence/nextAction) e exige "parse → validate → normalize" para texto livre. Isso é o coração: `src/ai/execution/subagent-result.ts` com `parseSubagentResult` (JSON ou texto → contrato válido). Os scouts são funções puras que produzem esses resultados a partir do GraphQueryResult — sem tocar em agente nenhum.
**Veredito:** Faça — contrato + parse/normalize + scouts puros.

### Advisor: The Expansionist

**Análise:** Vale incluir no mesmo PR: (1) `graph-freshness.ts` — compara built_at_commit vs HEAD e reporta stale (usado no Final Validator); (2) `sanitize.ts` — redação de CPF/keys/senhas/emails antes de qualquer envelope de telemetria; (3) Final Validator como checklist unificado (typecheck/lint/testes/gates/freshness/telemetry/budget) que o pre-pr pode chamar; (4) CLI `exec:scout <target>` e `exec:validate` (dry-run, fail-open). Não incluir: execução real de agentes (fica para adapter pi).
**Veredito:** Faça — módulos puros + CLI fail-open, sem execução de agente.

### Advisor: The Outsider

**Análise:** Para o dev, o ganho é o fluxo §3 executável: `exec:scout <target>` responde "o que essa mudança toca e quais testes existem" sem ler o projeto; `exec:validate` responde "code+tests+graph+telemetry+gates coerentes?" (§26). Isso prova a meta do §27 (mais qualidade, menos contexto) com métricas.
**Veredito:** Faça — CLI de scout/validate com output estruturado.

### Advisor: The Executor

**Análise:** Viabilidade: 1 PR com ~6 módulos em `src/ai/execution/` + CLI + testes. Rule-41 (<150 linhas): subagent-result e sanitize são pequenos; final-validator pode passar de 150 → split em checks separados. Rule-31: todos com teste. Escopo: NÃO criar adapters de agente reais (pi execute real) — isso é outra fase.
**Veredito:** Faça — 1 PR, TDD, pre-pr ao final.

### Peer Review (anônimo)

- **Reforço:** Consenso em módulos puros fail-open, parse/normalize do §14, sanitização com teste negativo de CPF.
- **Ajuste:** Executor: `final-validator.ts` deve ser um agregador de checks individuais (cada um < 150 linhas ou importado) para não estourar rule-41. Contrarian: `sanitize.ts` deve aceitar lista de patterns customizável, default cobrindo CPF (formato BR), chaves (key/token/secret), senhas (password/senha) e e-mails.

## Síntese do Chairman

**Consenso:** Implementar Agent Execution Core:

1. **`src/ai/execution/subagent-result.ts`** — `SubagentResult` (spec §14) + `parseSubagentResult` (JSON/texto → contrato, fail-open) + `validateSubagentResult`.
2. **`src/ai/execution/scouts.ts`** — `graphScout(target)` (impactScore/dependencies/dependents/tests/features/risks/recommendedFiles §15), `domainScout`, `testScout` — puros, fail-open sobre CRG.
3. **`src/ai/execution/architect.ts`** — `architectFromScouts(scouts, task)` → ExecutionPlan com write-set (usa planner existente).
4. **`src/ai/execution/sanitize.ts`** — `sanitizeText`/`sanitizeEnvelope` (redação CPF/chaves/senhas/emails; patterns customizáveis).
5. **`src/ai/execution/graph-freshness.ts`** — `checkGraphFreshness()` (built_at_commit vs HEAD).
6. **`src/ai/execution/final-validator.ts`** — agregador de checks (§21/§26): typecheck/lint/testes/freshness/telemetry/budget — cada check importado de módulo pequeno.
7. **CLI** `scripts/exec-intel.mjs` — `exec:scout <target>`, `exec:validate` (fail-open, dry-run).
8. **Testes** unit por módulo + docs + council.

**Veredito Final:** Faça — 1 PR, TDD, pre-pr ao final.

**Próximos Passos:** encaminhar para Superpowers — branch `feat/agent-execution-core`, TDD, CLI + package.json, docs, pre-pr + PR.

**Extended Thinking Usado:** sim — Contrarian (fail-open e sanitização) e Executor (split final-validator para rule-41).
