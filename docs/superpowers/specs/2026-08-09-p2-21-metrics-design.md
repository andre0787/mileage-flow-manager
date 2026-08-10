# Design — P2-21 Métricas do Programa de Engenharia

> Data: 2026-08-09 · Card: `docs/tasks/P2-21-metricas-programa.md` · Veredito council: `docs/council/2026-08-09-p2-21-metricas-programa-veredito.md`
> Categoria: feat · Branch: `feat/p2-21-metricas-programa`

## Objetivo

Medir se o programa de engenharia (gates, pre-pr, rules) realmente melhora a execução — em especial para modelo menor. Sem métrica, "parece melhor" não é sinal (veredito The Expansionist).

## Métricas e definições operacionais (INTENT gate)

| Métrica | Definição | Fonte |
|---------|-----------|-------|
| **Verde-na-1ª (local)** | 1º evento `pre-pr` PASS na branch sem `rule:fail` anterior na mesma branch | `docs/tracking/events.jsonl` |
| **Verde-na-1ª (CI)** | 1º check-run `check-pr` com conclusion `success` no head commit do PR, sem `failure` anterior | GitHub Check Runs API |
| **Falhas por categoria** | Eventos `rule:fail` agrupados pela categoria da branch (`feat/`, `fix/`, `docs/`, `chore/`, `refactor/`); fallback: join com `session:start` | `events.jsonl` + prefixo de branch |
| **Tempo até verificação (local)** | `session:start` → 1º `pre-pr` PASS na branch (reusa `computeCycleTime`) | `events.jsonl` |
| **Tempo até verificação (CI)** | PR `createdAt` → 1º check-run completado no head commit | GitHub API |
| **Reabertura/retrabalho** | PRs com evento `reopened` (issue-events) + branches com ≥2 `pre-pr` FAIL antes do PASS | GitHub Issues Events + `events.jsonl` |
| **Skips E2E** | Check-runs com conclusion `skipped` (ex: `e2e-smoke` em PR docs-only; `e2e-full` na cron) — rotulados "por design" | Check Runs API + Actions Runs |
| **Bypasses `--no-verify`** | **Proxy (não-mensurável via API):** PRs mergeados sem nenhum evento `pre-pr` na branch correspondente (join GitHub PR ↔ events.jsonl) | GitHub PR API + `events.jsonl` |

> ⚠️ **Nota honesta (5/5 advisors):** bypass de hook é **inobservável** pelo GitHub (git não grava a flag; `session-end.mjs` usa `--no-verify` legitimamente). Usamos proxy documentado e rotulamos a limitação no relatório. Instrumentação futura do `.githooks/pre-commit` fica fora do escopo deste card (arquivos permitidos não incluem hooks).

## Arquitetura

```
scripts/
  metrics-collect.mjs      → entry point fino (atalho npm `metrics:collect` NÃO muda; rule-16 ok)
  metrics/
    collect.mjs            → coleta GitHub API (PRs paginados, check-runs, issue-events, actions runs)
    aggregate.mjs          → agrega eventos locais (events.jsonl) + dados GitHub
    report.mjs             → gera relatório markdown + JSON
    lib.mjs                → helpers puros (categoria da branch, proxies, filtros) — testável
docs/metrics/              → snapshots versionados (relatório de período amostral)
tests/unit/metrics-p2-21.test.ts  → teste com fixtures (sem rede)
```

### Decisões-chave

1. **Reusar infra existente** (council 4/5): `parseProcessEvents` de `scripts/lib/process-events.mjs` e `computeCycleTime`/`isPrePrPass`/`isPrePrFail` de `scripts/kpi-report.mjs`. Nenhum parser paralelo.
2. **Stub `metrics-collect.mjs` absorvido**: vira entry que delega para `scripts/metrics/collect.mjs` (council 3/5 — mantém atalho npm, resolve conflito de path).
3. **Paginação**: `gh pr list --state all` com `--limit 100` + loop (council 2/5 — repo já tem ~330 PRs; limit 50 subestima).
4. **Slice por modelo**: quando `llm.route.resolved`/`coding:done` carregam `model`, o relatório agrupa verde-na-1ª/falhas por modelo (objetivo real: "melhorou para modelo menor?").
5. **Testes com fixture**: `tests/unit/` com `__fixtures__/metrics/events.jsonl` + `prs.json` + `checks.json` — sem dependência de rede no CI (council 1/5).

## Fluxo de dados

```
npm run metrics:collect
  → gh api paginado (PRs + check-runs + issue events + actions runs)
  → scripts/metrics/aggregate.mjs junta com events.jsonl (join por branch/número PR)
  → scripts/metrics/report.mjs escreve docs/metrics/<data>-metrics.md + .json
```

## Erros e limites

- Rate limit: 5k/h autenticado é folgado p/ 1 repo; script pagina e aceita `--since` (janela amostral).
- Check-runs com `conclusion: null` (em andamento) → tratar como "não concluído", excluir.
- API falhar (rede) → script falha com mensagem clara; testes NÃO dependem de rede.

## Testes (obrigatórios)

- `tests/unit/metrics-p2-21.test.ts` — fixture local: verde-na-1ª (local/CI), falhas por categoria, retrabalho, skips, bypass proxy, modelo.
- Evidência: rodar `npm run metrics:collect` real (rede OK) → relatório `docs/metrics/2026-08-09-metrics.md` de período amostral.

## Critérios de aceite

- [ ] `npm run metrics:collect` coleta via GitHub API (PRs paginados, checks, retries) em comando único.
- [ ] Métricas cobrem: verde-na-1ª, falhas por categoria, tempo até verificação, retrabalho, skips E2E, bypasses (proxy).
- [ ] Relatório gerado em markdown + JSON em `docs/metrics/`.
- [ ] Teste unitário com fixture passa sem rede.

## Não-objetivos (reafirmado)

- Telemetria de usuários finais (somente meta de engenharia).
- Instrumentação dos hooks (`--no-verify` real) — limitação documentada.
- Mudanças no app React (`src/`).
