# AI Session State - 2026-08-22T13:35:00.000Z

## Última Task

- **Refactor/bugfix — plano LLM menor + higiene P12.6 aplicado** na branch `arena/01a02942-mileage-flow-manager`.
- Base atualizada por fast-forward para `93fdc55` antes da implementação.
- Principais mudanças:
  - `scripts/p12.6-experiment.mjs`: cleanup com remoção de `.p126-backup`, `try/finally`, `--no-report`, exports para testes e aviso explícito de detecção simulada.
  - `.pi/skills/context-window-management/SKILL.md`: substitui symlink quebrado por skill repo-local curta.
  - `src/ai/mutation/promotion/source-registry.ts` + `src/pages/Promocoes.tsx`: URL oficial da Azul corrigida e centralizada; filtro por tipo em promoções ativado.
  - `src/pages/AgentLab.tsx` foi quebrado em `src/components/agent-lab/*` e consome último relatório P12.6 via `src/lib/agentLabData.ts`.
  - `src/App.tsx` + `src/components/AppSidebar.tsx`: Agent Lab protegido por `VITE_AGENT_LAB_ENABLED=true`.
  - `src/contexts/DataContext.tsx`: Provider value memoizado; ações com `useCallback`.
  - `src/components/GlobalSearch.tsx`: índices `Map` para reduzir `find` repetido.
  - `scripts/trim-tracking.mjs` + `scripts/context-audit.mjs`: budgets por bytes e status sensível a tracking; tracking ativo reduzido.
  - `scripts/context-pack.mjs`: opção `--compact` para modelos menores.
  - `src/lib/logger.ts`: debug log passa a ser opt-in (`VITE_ENABLE_DEBUG_LOG=true`) e busca correta do userId Supabase.

## Estado dos Testes & Qualidade

- ✅ `npm run typecheck`
- ✅ `npm run lint`
- ✅ `npm test` — 141 files / 1202 tests
- ✅ `npm run build && npm run budget:check`
- ✅ `npm run format:check`
- ✅ `npm run project:audit -- --json` — rule-23 passou
- ✅ `npm run verify-docs && npm run task:validate`
- ✅ `npm run p12.6:experiment -- --no-report` — sem backups restantes

## Arquivos Modificados & Impacto

- Scripts: `p12.6-experiment`, `trim-tracking`, `context-audit`, `context-pack`.
- UI/runtime: `App`, `AppSidebar`, `GlobalSearch`, `DataContext`, `Promocoes`.
- AI/promo: `source-registry`.
- Docs/tracking: rotação ativa de `events.jsonl`/`quality.jsonl` para reduzir overhead de contexto.
- Testes novos: higiene do experimento P12.6 e source registry.

## Pendências Imediatas (Next Step)

- Revisar se queremos expor `/agent-lab` em algum ambiente definindo `VITE_AGENT_LAB_ENABLED=true`.
- Revisar se queremos expor `/agent-lab` em algum ambiente definindo `VITE_AGENT_LAB_ENABLED=true`.

## Governança de Contexto

- **Tokens Utilizados:** reduzidos no tracking ativo; `context:audit` agora mostra events≈19.9K tok e quality≈10K tok.
- **Poda (Pruning):** `context:trim` aplicado com budgets 80KB/40KB.
- **Branch Atual:** `arena/01a02942-mileage-flow-manager` em `93fdc55` + alterações locais.
