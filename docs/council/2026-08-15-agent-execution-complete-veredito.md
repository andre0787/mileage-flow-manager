# Veredito — Agent Execution Spec v5: completar itens restantes

**Tema:** Concluir os itens de código da 02-Agent-Execution-Spec v5 ainda não entregues: **Reviewer (§20)**, **Domain Scout completo (§16 — tabelas/regras)** e **P8 — envelopes reais** (conectar o `onTelemetry` do dispatcher ao `telemetry:persist`, env-gated). Base: PRs #413/#417/#421/#425.
**Data:** 2026-08-15
**Sessão:** feature — completar Agent Execution Spec v5

## Gap analysis final

| Spec                                                                                                  | Estado                                                |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| §2-13 (core, packet, subagentes, paralelismo, routing, telemetria, budget)                            | ✅ PRs #413/#417/#421                                 |
| §14 SubagentResult · §15-17 Scouts · §18 Architect · §12 sanitize · §22 freshness · §21/§26 validator | ✅ PR #425                                            |
| **§20 Reviewer**                                                                                      | ❌ não existe                                         |
| **§16 Domain Scout (tables/businessRules)**                                                           | ⚠️ entities via grafo; tables/businessRules vazios    |
| **§11/§19 telemetria real (P8)**                                                                      | ⚠️ envelope+persist prontos; dispatcher não conectado |

## Advisors

### Advisor: The Contrarian

**Análise:** Reviewer (§20) precisa receber diff + task + arquitetura + graph impact — como função pura que avalia um diff (arquivos tocados vs writeScope, testes ausentes vs arquivos, risco por impacto). Pode usar `git diff --name-only` no caller e passar arrays. Domain Scout: tabelas podem ser extraídas das migrations (`CREATE TABLE`) sem conectar no banco — fail-open. P8: conectar onTelemetry→persist com env-gate (`TELEMETRY_PERSIST=1`) para não atrasar execuções normais.
**Veredito:** Faça — reviewer puro, tables via migrations, P8 env-gated.

### Advisor: First Principles Thinker

**Análise:** O reviewer avalia o que o implementer fez: arquivos fora do writeScope = violação; arquivos sem teste = gap; risco alto com impacto alto = sinal. Domain Scout: o schema real está nas migrations — parsear `CREATE TABLE public.(\w+)` dá as tabelas; regras de negócio ficam como lista vazia (não inferíveis sem domínio) mas documentadas.
**Veredito:** Faça — reviewer com heurísticas claras, tables via migrations.

### Advisor: The Expansionist

**Análise:** P8 fecha o loop da spec §27 (provar por métricas): `exec:run <task>` executa um plano real (planner→scheduler→dispatcher) com onTelemetry→persist (env-gated), e o `exec:validate` passa no telemetry-completeness. Vale incluir o reviewer no fluxo: `exec:review` (dry-run, recebe diff).
**Veredito:** Faça — exec:run (dry ou real, env-gated) + exec:review.

### Advisor: The Outsider

**Análise:** O ganho concreto: `exec:run P8-01` roda o pipeline §3 inteiro (interpretar→consultar grafo→planejar→delegar→implementar→validar→telemetria) e `exec:review` responde "o diff respeita o writeScope? faltam testes?". Isso prova o §27 com métricas de telemetria reais.
**Veredito:** Faça — pipeline executável + reviewer.

### Advisor: The Executor

**Análise:** Viabilidade: 1 PR. (A) `src/ai/execution/reviewer.ts` — `reviewDiff({diffFiles, task, writeScope, graphScout})` → SubagentResult com risks/recommendations (fail-open); (B) `domainScout` ganha `tables` via parse de migrations; (C) `scripts/exec-intel.mjs` ganha `run <task>` (planner+dispatcher com onTelemetry→persist quando TELEMETRY_PERSIST=1) e `review <alvo>` (diff vs HEAD); (D) testes + docs. Rule-41: <150 linhas.
**Veredito:** Faça — 1 PR, TDD, pre-pr ao final.

### Peer Review (anônimo)

- **Reforço:** Consenso em reviewer puro, tables via migrations (sem banco), P8 env-gated.
- **Ajuste:** Executor: `exec:run` em modo real só persiste com `TELEMETRY_PERSIST=1`; sem env, roda dry-run (imprime plano+envelopes, não insere). Contrarian: reviewer marca arquivo fora do writeScope como risk, não como fail automático (writeScope é intenção, não lei).

## Síntese do Chairman

**Consenso:** Implementar o fechamento da spec v5:

1. **`src/ai/execution/reviewer.ts`** — `reviewDiff({diffFiles, writeScope, task, impactScore})` → SubagentResult (§20: regressões/contratos/segurança/testes ausentes/inconsistências). Arquivo fora do writeScope = risk.
2. **`domainScout`** — preencher `tables` via parse de `supabase/migrations/*.sql` (`CREATE TABLE public.(\w+)`), fail-open.
3. **CLI `exec:run <task>`** — pipeline §3 real: planner (com adapters pi/generic) → scheduler → dispatcher com `onTelemetry`; `TELEMETRY_PERSIST=1` persiste envelopes (§19), senão dry-run.
4. **CLI `exec:review <alvo>`** — reviewer do diff vs HEAD (fail-open).
5. **Testes** (reviewer, domain tables, exec:run dry) + docs.

**Veredito Final:** Faça — 1 PR, TDD, pre-pr ao final.

**Próximos Passos:** encaminhar para Superpowers — branch `feat/agent-execution-complete`, TDD, CLI + atalhos, docs, pre-pr + PR + merge.

**Extended Thinking Usado:** sim — Contrarian (env-gate e writeScope como risk) e Executor (viabilidade 1 PR).
