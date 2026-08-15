# 🏗️ Arquitetura — MilesControl

> A árvore canônica completa de `src/` (gerada por `npm run map:sync`) está no
> [`docs/MAP.md`](MAP.md#STRUCTURE-START). Abaixo: as camadas de alto nível.

## Estrutura de Pastas

```
src/
├── ai/                    # AI Core (SDD v5.0 — P5-01/P11/P12)
│   ├── core/              # Contratos: agent, model, task, context-packet, graph-types
│   ├── adapters/          # Pi, Generic, Registry (implementam AgentAdapter)
│   ├── orchestration/     # Planner, Scheduler, Dispatcher, Budget, Classifier, Adaptive
│   ├── execution/         # Scouts, Architect, Implementer, Reviewer, Retry, FinalValidator
│   ├── telemetry/         # Envelope §19 + completeness + persist
│   ├── graph/             # Engine CRG + metrics (p50/p95/p99) + graph-value + readiness
│   ├── benchmark/         # P11-06: dataset T1-T8, profiles, scoring, compare
│   └── validation/        # P12: dataset real R1-R24, runner, reliability, ROI, workflow
├── components/
│   ├── ui/                # shadcn/ui (19 mantidos)
│   ├── kpi/               # AI Engineering Command Center + panels (P11-08)
│   ├── workflow/          # WorkflowPipelineDag + timeline (P11-09)
│   └── ...                # componentes de página (AccountDialog, MetricCard, etc.)
├── contexts/              # DataContext, I18nContext, OnlineContext
├── features/              # Feature-First: entradas, contas, clientes, vendas, alerts,
│                          #   owners, programs, origemTypes, api, auth, store (RTK)
├── hooks/                 # useDatabase (legado residual), useDebounce, useHaptic, etc.
├── lib/
│   ├── ai-engineering/    # P11-08: executive, phases, agents, bottlenecks, graph-roi
│   ├── aiEngineering.ts   # Barrel do AI Engineering (KPI)
│   ├── aiTelemetry.ts     # Telemetria de IA (table ai_telemetry)
│   ├── metrics.ts         # Regras financeiras PURAS (fonte da verdade)
│   └── ...                # contas, dates, recurrence, transferCalc, supabase, etc.
├── pages/                 # Dashboard, Entradas, Vendas, Contas, KPI, Workflow, etc.
└── types/                 # Tipos TS
```

## Fluxo de Dados

```
Usuário → React Query → Supabase (RLS por user_id)
              ↓
         DataContext (cache + isLoading)
              ↓
         Páginas (Dashboard, Entradas...)
              ↓
         Componentes (MetricCard, AltitudeBar...)
```

### Regras

- **Business logic em `lib/`** (funções puras, sem React/Supabase)
- **Queries/mutations em `hooks/useDatabase.ts`**
- **UI em `pages/` e `components/`**
- **DataContext**: só dados + isLoading + clearCache/clearAccountData. Mutations NÃO ficam no contexto.
- **React Query**: staleTime 30s, invalidateQueries após mutations
- **Todo mapper snake_case → camelCase** centralizado em `lib/utils.ts`

## AI Core (SDD v5.0)

O `src/ai/` é o núcleo agnóstico de agente (P5-01) evoluído pelas P11 (build) e
P12 (measure):

| Camada | O que faz |
|--------|-----------|
| `core/` | Contratos: `AgentAdapter` (health/version), `ModelCapabilities`, `TaskContract`, `ContextPacket` (graph/domain/history/test + freshness), `ExecutionPlan`/`Budget` |
| `adapters/` | Implementações concretas: `pi` (CLI bridge, fail-open), `generic` (degradado), `registry` |
| `orchestration/` | Planner (capability-driven), Scheduler (batches), Dispatcher (budget/retry/cancel), Classifier + Adaptive Planner (tiny→large), Explainability |
| `execution/` | Scouts (graph/domain/test/history), Architect, Implementer, Reviewer, Final Validator, Failure Taxonomy, Retry, Command Runner |
| `telemetry/` | Envelope §19 (runId/planId/stepId/cost/model identity), completeness checker, persist (ai_telemetry) |
| `graph/` | Engine CRG v2.3.7, metrics p50/p95/p99 + cache + multi-hop, graph-value comparator, Neo4j readiness |
| `benchmark/` | P11-06: dataset T1-T8, estratégias A/B/C (single/multi/graph+multi), relatório comparativo |
| `validation/` | P12: dataset real R1-R24, runner determinístico 162 runs, reliability/bottlenecks, Graph ROI, workflow efficiency |

**Princípios:** P1 agent-agnostic (core nunca importa SDK de agente) · P4 evidence-driven
(nada de Neo4j/novo agente sem métrica) · P5 telemetry-first. Regra-31: toda lib em
`src/lib/` e `src/ai/` tem teste unitário.

## KPI / Observabilidade

- **`src/lib/aiEngineering.ts`** — agregação de envelopes (executive, phases, agents,
  bottlenecks, graph ROI) exibida no AI Engineering Command Center (`src/components/kpi/`).
- **`src/pages/Workflow.tsx`** — DAG do pipeline real (`WorkflowPipelineDag`) com inspeção
  por node e Why? (explicabilidade da orquestração).
- **Relatórios P12:** `docs/P12-REAL-WORLD-EVIDENCE-REPORT.md` + `docs/P13-EVIDENCE-DRIVEN-ROADMAP.md`
- **P12.5 (Public Demo / Agentic E2E):** módulo `src/ai/e2e/` (demo tenant, access gate, lifecycle, limits, browser adapter, scenarios, evidence, QA/Triage/Fix agents, regression, KPI, security) + docs [P12.5-BASELINE](P12.5-BASELINE.md), [P12.5-THREAT-MODEL](P12.5-THREAT-MODEL.md), [P12.5-EVIDENCE-REPORT](P12.5-EVIDENCE-REPORT.md). Comandos: `npm run p12.5:validate` e `npm run ai:p12.5:score`. Autonomia capped no Level 3.
  gerados por `npm run p12:validate`.

## Rotas

| Rota | Página | Autenticação |
|------|--------|-------------|
| `/login` | Login | Pública |
| `/` | Dashboard | Protegida |
| `/entradas` | Entradas | Protegida |
| `/vendas` | Vendas | Protegida |
| `/contas` | Contas | Protegida |
| `/clientes` | Clientes | Protegida |
| `/controle-cpf` | ControleCPF | Protegida |
| `/relatorios` | Relatorios | Protegida |
| `/configuracoes` | Configuracoes | Protegida |
| `/perfil` | Perfil | Protegida |
| `/forgot-password` | ForgotPassword | Pública |
| `/reset-password` | ResetPassword | Pública |

## Banco de Dados (Supabase)

Tabelas: `profiles`, `owners`, `programs`, `origem_types`, `accounts`, `entries`, `clients`, `sales`

- **RLS**: todas as tabelas filtram por `user_id = auth.uid()`
- **Auth**: email/senha, sem confirmação de email

## PWA / Offline (Sprint #6)

- **Service Worker**: Workbox via `vite-plugin-pwa` (cache de assets + API)
- **OnlineContext**: estado da conexão (`isOnline`)
- **OfflineBanner**: aviso quando sem internet
- **Botões desabilitados**: criação/edição bloqueada offline
