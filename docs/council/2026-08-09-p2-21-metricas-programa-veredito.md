# Veredito do Council — P2-21 Métricas do Programa

> Data: 2026-08-09 · Categoria: feat · Card: `docs/tasks/P2-21-metricas-programa.md`
> Método: LLM Council (5 advisors + chairman), Extended Thinking não necessário (risco baixo, escopo de scripts).

## Advisors

1. **The Contrarian** — Reformule
2. **First Principles Thinker** — Reformule
3. **The Expansionist** — Faça (com expansões)
4. **The Outsider** — Reformule
5. **The Executor** — Faça (com 2 ajustes de escopo)

## Consenso convergente (5/5 ou 4/5)

| # | Achado | Advisors | Tratamento no design |
|---|--------|----------|----------------------|
| 1 | **"Bypasses `--no-verify`" não é observável via GitHub API** (git não grava a flag; hook nem roda; `session-end.mjs` usa `--no-verify` legitimamente) | 5/5 | Redefinir como **proxy mensurável**: PRs mergeados sem evento `pre-pr PASS` na branch (join events.jsonl) + documentar limitação; instrumentação futura do hook fica fora do escopo |
| 2 | **Reutilizar infra existente** (`scripts/lib/process-events.mjs`, `kpi-report.mjs`, stub `metrics-collect.mjs`) — não criar parser paralelo (rule-15/drift) | 4/5 | Coletor novo em `scripts/metrics/*`; `metrics-collect.mjs` vira entry point fino que delega; `kpi` reutilizado p/ falhas/retrabalho |
| 3 | **"Verde-na-1ª" e "tempo até verificação" sem definição operacional** (pre-pr local vs CI check-runs são 3 "verdes" diferentes) | 4/5 | Definir na spec: verde-na-1ª = 1º pre-pr PASS sem `rule:fail` anterior na branch (local) E 1º check-run `check-pr` success (CI), rotulados; tempo até verificação = `createdAt`→1º check completado (CI) e `session:start`→pre-pr PASS (local) |
| 4 | **Skips E2E vêm de Actions Runs / check-runs** (`e2e-smoke` skipped em PRs docs-only; `nightly e2e-full` skipado na cron) — discriminar skip por design vs evasão | 4/5 | Coletar conclusões `skipped` dos check-runs + `actions/runs`; rotular "por design" |
| 5 | **`categoria` ausente em `pre-pr`/`rule:fail`** (só `session:start` tem) | 3/5 | Derivar do prefixo da branch (`feat/`, `fix/`, `docs/`, `chore/`, `refactor/`) — mapeamento limpo nos dados |
| 6 | **Conflito de path**: card permite `scripts/metrics/*` mas stub trackeado em `scripts/metrics-collect.mjs` (PR #187) | 3/5 | Manter `metrics-collect.mjs` como entry (atalho npm não muda, rule-16 ok); lógica em `scripts/metrics/` |
| 7 | **Slice por modelo** — objetivo real é "melhorou para modelo menor?"; `llm.route.resolved`/`coding:done` carregam `model` | 2/5 | Relatório agrupa métricas por `model` quando disponível |
| 8 | **Paginação do `gh pr list`** (limit 50 subestima ~330 PRs) | 2/5 | Paginar + `--since`/janela amostral explícita |
| 9 | **Teste com fixture, não rede** (depender de rede no teste obrigatório é flaky) | 1/5 | Teste unitário com fixture de events.jsonl + fixtures de check-runs; `metrics:collect` real roda manualmente p/ evidência |

## Síntese do Chairman (Executor)

**Consenso:** o card é viável e de alto valor — a telemetria de engenharia é o sinal que o programa precisa ("Sem métrica, 'parece melhor' não é sinal"). Os dados brutos já existem (`docs/tracking/events.jsonl`, 1.528 eventos; ~330 PRs; `gh` autenticado). Nenhum advisor recomendou "Não faça". As reformulações convergem em: definir operacionalmente as métricas, trocar bypasses por proxy mensurável, reutilizar parsers existentes e resolver o conflito de path do stub.

**Veredito Final:** **Faça (reformulado)** — prossegue para Fase 2 (Superpowers) com os ajustes de design da tabela acima incorporados.

**Próximos Passos:**
1. Brainstorming → spec em `docs/superpowers/specs/2026-08-09-p2-21-metrics-design.md`
2. writing-plans → plano em `docs/superpowers/plans/`
3. Branch `feat/p2-21-metricas-programa`
4. TDD: `scripts/metrics/*` + entry `metrics-collect.mjs` + teste com fixture
5. Relatório de evidência de período amostral → pre-pr → PR

**Extended Thinking Usado:** não (escopo de scripts, risco baixo, dados suficientes).
