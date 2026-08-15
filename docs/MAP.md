# 🗺️ Mapa do Projeto — MilesControl

> Leia este arquivo primeiro. Ele orienta qual doc ler para cada situação.

## Docs de Código

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `STACK.md` | Setup inicial, comandos, dependências | Stack, npm scripts, env vars |
| `ARCHITECTURE.md` | Antes de criar/modificar arquivos | Estrutura de pastas, fluxo de dados, roteamento |
| `CONVENTIONS.md` | Antes de escrever código | Padrões de código, nomenclatura, DRY, imports |
| `UI-GUIDE.md` | Antes de criar/modificar UI | Design system, grid, cores, tipografia, componentes |
| `DEBUG.md` | Quando precisar debugar | Logger, breakpoints, launch.json, console.log rules |

## Docs de Processo

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `WORKFLOW-MANIFEST.md` | **Sempre primeiro** | Fonte canônica: categorias, estados, comandos obrigatórios, alvo de PR, política de bypass |
| `WORKFLOW.md` | Antes de iniciar qualquer feature | Workflow council-to-superpowers + LLM Council + **navegação Serena-First** (detalhamento do manifesto) |
| `AGENDA.md` | Obsoleto/arquivado | Stub que aponta para `docs/archive/AGENDA-2026.md`; use `docs/tasks/ROADMAP.md` e GitHub Issues |
| `GIT-WORKFLOW.md` | Antes de commitar/criar PR | Branches, commits, PR, deploy |
| `TESTING.md` | Antes de rodar testes | Playwright, bateria obrigatória, helpers |
| `TESTING-PRODUCTION.md` | Testes contra produção | Metodologia duas camadas, armadilhas, CI pós-deploy |
| `TEST-PLAN.md` | Planejamento de testes | 32 casos organizados em 3 fases, prioridades |
| `MAPA-EXPERIENCIAS-USUARIO.md` | Contexto UX | 43 fluxos de usuário, 85+ cenários de teste, edge cases |
| `docs/handoff.md` | Início/fim de sessão | Contexto entre sessões, branch atual, PRs, próximos passos |
| `docs/CI-PROCESS.md` | Melhoria contínua | Ciclo de melhoria: coletar → priorizar → executar → revisar → retrospectiva |
| `docs/RADAR.md` | **Início de toda sessão (automático)** | Relatório persistente de vulnerabilidades npm monitoradas (gerado pelo `scripts/check-radar.mjs`) |
| `docs/audits/2026-08-03-project-audit.md` | Ao investigar estrutura/sujeira do repositório | Snapshot read-only da auditoria estrutural (`npm run project:audit`): checks, findings, allowlists |
| `docs/audits/2026-08-07-docs-audit.md` | Ao auditar docs/skills/pendências | Auditoria completa de docs: checklist 6 itens, inventário .md, limpeza executada, órfãos, skills, pendências mapeadas |

## Docs de Roadmap / Task-cards

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| [`docs/tasks/ROADMAP.md`](tasks/ROADMAP.md) | Antes de planejar trabalho de workflow/agente | Índice em 4 ondas (P0/P1/P2/P3) de 25 task-cards |
| [`docs/ROADMAP.md`](ROADMAP.md) | Backlog de itens do futuro fora da sessão corrente | Itens P1-P4 priorizados (react-router GHSA, npm audit, subagentes, branch órfã) |
| `docs/tasks/_TEMPLATE.md` | Ao criar novo task-card | Estrutura canônica do card (objetivo, arquivos permitidos, critérios de aceite, testes, evidência) |
| [`docs/tasks/P3-26-blueprint-v4-p0.md`](tasks/P3-26-blueprint-v4-p0.md) | Ao executar a Fase P0 do Blueprint v4 | Card da Fase P0: grafo de dependências, regras 40/41, sync-map — spec em `docs/superpowers/specs/2026-08-10-blueprint-v4-p0-design.md` |
| [`docs/tasks/P3-27-blueprint-v4-p1-foundation-auth.md`](tasks/P3-27-blueprint-v4-p1-foundation-auth.md) | Ao executar a Fase P1 do Blueprint v4 (card 1) | Card da Fase P1: fundação Feature-First (RTK) + migração do domínio auth — spec em `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-foundation-auth-design.md` |

> **Coleção de task-cards** (`docs/tasks/`): 25 cards granulares em 4 ondas (P0/P1/P2/P3).
> O índice navegável está em `docs/tasks/ROADMAP.md`. Cards P3 de housekeeping:
> `P3-23-delete-archive-debris.md`, `P3-24-retire-changelog.md`, `P3-25-clean-thoughts.md`.
> Cards P1 de infraestrutura de regras: `P1-15-fixtures-negativas-regras.md`, `P1-16-ast-regras-alto-risco.md`, `P1-17-invariantes-financeiras.md`, `P1-18-e2e-estabiliza.md`.

## Docs do Ecossistema

| Arquivo | Quando ler | O que contém |
|---------|-----------|--------------|
| `STACK.md` (seção Agente) | Quando precisar de ferramentas do agente | pi, opencode, MCPs, plugins, skills, subagentes |
| `docs/memory.md` | Contexto de sessões anteriores | Histórico de decisões, sprints, post-mortems |
| `docs/IDEIAS.md` | Caixa de entrada de ideias | Ideias humanas pendentes, lidas no início da sessão |
| `docs/FLUXO.md` | Diagramas do ecossistema | Flowcharts Mermaid: visão geral, fluxo de dados, rotas |
| `docs/council/` | Vereditos de decisões | Recomendações do LLM Council (feature planning). Atuais: `2026-07-16-ios-form-stability-veredito.md`, `2026-07-16-auto-refresh-after-mutations-veredito.md`, `2026-07-16-recorrencia-automatica-veredito.md`, `2026-07-19-p0-5-workflow-hardening-veredito.md`, `2026-07-24-entry-create-account-veredito.md`, `2026-08-01-llm-model-router-veredito.md`, `2026-08-03-process-kpis-router-sanitizacao-veredito.md`, `2026-08-04-ux-entradas-vendas-veredito.md`, `2026-08-05-process-violations-veredito.md` |
| `docs/superpowers/specs/` | Especificações técnicas | Specs de features avaliadas pelo council. Atuais: `2026-07-16-ios-form-stability-design.md`, `2026-07-24-entry-create-account-design.md`, `2026-07-28-prompt-versioning-design.md`, `2026-07-29-classification-nl-design-spec.md`, `2026-07-29-auth-ci-design.md`, `2026-07-29-fable-method-skill-design.md`, `2026-08-01-llm-model-router-design.md`, `2026-08-03-process-guardrails-design.md`, `2026-08-03-llm-router-kpi-design.md`, `2026-08-03-project-sanitization-design.md`, `2026-08-03-react-router-8-upgrade-design.md`, `2026-08-04-ux-entradas-vendas.md`, `2026-08-10-blueprint-v4-p0-design.md` |
| `docs/superpowers/plans/` | Planos de execução | Planos detalhados de implementação. Atuais: `2026-07-16-ios-form-stability.md`, `2026-07-28-prompt-versioning-plan.md`, `2026-07-29-auth-ci-plan.md`, `2026-07-29-fable-method-skill-plan.md`, `2026-08-01-llm-model-router-plan.md`, `2026-08-03-process-guardrails-plan.md`, `2026-08-03-llm-router-kpi-plan.md`, `2026-08-03-project-sanitization-plan.md` |
| [`docs/LLM-ROUTER.md`](LLM-ROUTER.md) | Router de subagentes | Contrato operacional, comandos, precedência, auditoria e escopo multimodal futuro |
| `docs/reports/` | Relatórios HTML | Relatórios obrigatórios antes de cada PR |
| `.githooks/` | Git hooks | Pre-commit que bloqueia commits na main |
| `.pi/skills/fable-method/SKILL.md` | Skill primária de desenvolvimento | Loop de 7 passos Fable Method adaptado ao MilesControl — costura categorias, gates, workflow e scripts |
| `.pi/skills/subagent-driven-development/SKILL.md` | Execução delegada com subagentes | Plano → subagente por tarefa → task review → final review |
| `.pi/skills/dispatching-parallel-agents/SKILL.md` | Investigação paralela | 1 subagente por domínio de problema independente |
| `.pi/skills/compact-delegation/SKILL.md` | Delegação econômica | Contrato universal: contexto mínimo + retorno estruturado por campos (reduz tokens por dispatch) |
| `.pi/skills/bounded-scout/SKILL.md` | Exploração de escopo estreito | Scout retorna file|line|finding — sem carregar arquivos no contexto |
| `.pi/skills/diff-miner/SKILL.md` | Análise de diffs | Lê o diff (não os arquivos) e retorna impact|risk|files |
| `.pi/skills/test-triage/SKILL.md` | Triagem de falhas de teste | Roda só o teste falho e retorna cause|fix|evidence |
| `.pi/skills/using-git-worktrees/SKILL.md` | Worktrees isolados | Branches separadas para trabalho concorrente sem conflito |
| `.pi/skills/council-to-superpowers/SKILL.md` | Workflow feature | Council → **INTENT gate** → brainstorming → plans → execução → PR |
| `.pi/skills/writing-plans/SKILL.md` | Planos de implementação | **INTENT gate** antes de definir tasks — alinha código, teste e spec |
| `.pi/skills/systematic-debugging/SKILL.md` | Debug estruturado | **TWINS check** ao corrigir bugs — busca mesmo padrão no projeto todo |
| `.pi/skills/finishing-a-development-branch/SKILL.md` | Finalização de branch | **AUTH gate** — exige palavras do usuário antes de push/merge/deploy irreversível |
| `.pi/skills/using-superpowers/SKILL.md` | Início de qualquer conversa | Descobre e invoca skills antes de responder; ver `docs/STACK.md` (seção Agente) |
| `.pi/skills/brainstorming/SKILL.md` | Antes de trabalho criativo | Explora intenção, requisitos e design antes de implementar |
| `.pi/skills/llm-council/SKILL.md` | Decisões estratégicas | 5 conselheiros + síntese do chairman — usado internamente pelo council-to-superpowers |
| `.pi/skills/test-driven-development/SKILL.md` | Antes de implementar feature/bugfix | Escreve teste que falha → implementa → refatora |
| `.pi/skills/executing-plans/SKILL.md` | Execução de plano em sessão separada | Checkpoints de revisão entre sessões |
| `.pi/skills/verification-before-completion/SKILL.md` | Antes de declarar trabalho pronto | Evidência antes de afirmação — roda comandos e confirma output |
| `.pi/skills/requesting-code-review/SKILL.md` | Antes de merge | Verifica se o trabalho atende requisitos |
| `.pi/skills/receiving-code-review/SKILL.md` | Ao receber feedback de review | Rigor técnico e verificação, não concordância performática |
| `.pi/skills/small-model-execution/SKILL.md` | Execução com modelo pequeno | Fluxo mínimo para executar task-card de `docs/tasks/` usando comandos versionados |
| `.pi/skills/writing-skills/SKILL.md` | Criar/editar skills | Valida skills antes do deploy |
| `scripts/check-feedback.mjs` | Verificação de feedback | Consulta feedbacks de usuários no Supabase |
| `scripts/check-deploy.mjs` | Saúde do deploy | Verifica status do último deploy via GitHub API |
| `scripts/retro.mjs` | Retrospectiva | Gera relatório de retrospectiva do período |
| `scripts/rules/rule-22-pr-naming.mjs` | Validação de PR | Valida nomenclatura de PRs no pre-pr |
| `scripts/twins-check.mjs` | TWINS gate | Busca automatizada de padrões no código |
| `scripts/process-audit.mjs` | Auditoria de evidência | Valida `docs/tracking/events.jsonl` (read-only); `--check`/`--json` |
| `code-review-graph` (CLI, via `npm run crg:*`) | Grafo estrutural | Tree-sitter: `crg:architecture`, `crg:dead-code`, `crg:impact`, `crg:detect-changes`, `crg:status`, `crg:build/update`, `crg:wiki` — ver skill `.pi/skills/code-review-graph/SKILL.md` e WORKFLOW.md |
| `rule-38-code-review-gate.mjs` | Gate de revisão | Todo PR exige evento `code-review:done` (subagente) em `docs/tracking/events.jsonl` — ver `requesting-code-review` |
| `rule-39-coding-gate.mjs` | Gate de codificação | Mudanças de código exigem evento `coding:done` (subagente) em `docs/tracking/events.jsonl` — ver `subagent-driven-development` |
| `scripts/lib/process-events.mjs` | Contrato de eventos | Parser + validador compartilhado (CLI e rule-36) |
| `scripts/lib/generated-artifacts.mjs` | Staging de artefatos | Allowlist dos 4+2 artefatos gerados stageados no pre-pr |
| `scripts/rules/rule-36-process-evidence.mjs` | Guardrail #36 | Evidência de processo válida no pre-pr |
| `CLAUDE.md` | Cross-harness (Claude Code) | Instruções resumidas para Claude Code |
| `QUALITY.md` | Qualidade do código | Métricas e padrões de qualidade |

## KPIs de Processo

Dashboard mensal de métricas de qualidade do desenvolvimento:

| O quê | Caminho |
|-------|---------|
| Design spec | `docs/superpowers/specs/2026-07-29-kpi-process-design.md` |
| Implementation plan | `docs/superpowers/plans/2026-07-29-kpi-process-plan.md` |
| Script | `scripts/kpi-report.mjs` |
| App page | `src/pages/KPI.tsx` |
| Comando | `npm run kpi` |

## Docs Arquivados

Artefatos de sprints/features concluídos foram movidos para `docs/archive/`:

| Diretório | Conteúdo |
|-----------|----------|
| `docs/archive/specs/` | 19 specs de features já implementadas |
| `docs/archive/plans/` | 9 planos de features já implementadas |
| `docs/archive/council/` | 10 vereditos de decisões concluídas |
| `docs/archive/` raiz | Nenhum — todos removidos |

## Gates do Fable Method

3 gates importados do [Fable Method](https://github.com/Sahir619/fable-method) para aumento de rigor:

| Gate | Onde | O que faz |
|------|------|-----------|
| 🧠 **INTENT** | `council-to-superpowers` + `writing-plans` | Antes de qualquer edição: alinha código, teste e spec com declaração explícita |
| 🔁 **TWINS** | `systematic-debugging` | Ao corrigir bug: busca mesmo padrão no projeto todo e corrige todas as ocorrências |
| 🔐 **AUTH** | `finishing-a-development-branch` | Antes de push/merge/deploy: exige as palavras exatas do usuário como autorização |

## Fable Method — Fase 2 Audit

[`docs/archive/fable-method-audit.md`](archive/fable-method-audit.md) — Auditoria da entrega prompt-versioning (arquivada em 07/08, ciclo encerrado)
(PR #219) verificando se os 3 gates teriam pego problemas reais.

**ROI verificado: 🟢 Positivo.** Ver auditoria completa no link acima.

## Regra de Ouro

**Sempre leia `WORKFLOW-MANIFEST.md` + docs da categoria em `AGENTS.md`; não carregue `AGENDA.md` em sessões normais.**

## Navegação Rápida
- [`WORKFLOW-MANIFEST.md`](WORKFLOW-MANIFEST.md) — **Workflow canônico** (categorias, estados, comandos, alvo de PR, bypass)

<!-- STRUCTURE-START -->
```tree
src/
├── components/
│   ├── kpi/
│   │   ├── BusinessPanel.tsx
│   │   ├── MonthlySection.tsx
│   │   ├── ProcessDailySection.tsx
│   │   └── PrsPanel.tsx
│   ├── tests/
│   │   ├── AccountAlertsDialog.test.tsx
│   │   ├── AccountDialog.test.tsx
│   │   ├── FormDrawer.test.tsx
│   │   ├── GlobalSearch.test.tsx
│   │   └── Workflow.test.tsx
│   ├── ui/
│   │   ├── alert-dialog.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── DataTable.tsx
│   │   ├── dialog.tsx
│   │   ├── drawer.tsx
│   │   ├── index.ts
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── OwnerFilter.tsx
│   │   ├── progress.tsx
│   │   ├── SearchInput.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   ├── SortableHeader.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   ├── workflow/
│   │   ├── WorkflowEfficiency.tsx
│   │   ├── WorkflowGates.tsx
│   │   ├── WorkflowHero.tsx
│   │   ├── WorkflowJourney.tsx
│   │   ├── WorkflowMindMap.tsx
│   │   ├── WorkflowOverview.tsx
│   │   ├── WorkflowSimulator.tsx
│   │   ├── WorkflowTelemetry.tsx
│   │   └── WorkflowTimeline.tsx
│   ├── AccountAlertsDialog.tsx
│   ├── AccountDialog.tsx
│   ├── AltitudeBar.tsx
│   ├── AnimatedNumber.tsx
│   ├── AppSidebar.tsx
│   ├── BalanceReconcileBanner.tsx
│   ├── BottomTabBar.tsx
│   ├── DashboardCharts.tsx
│   ├── DashboardChartsContent.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── DeleteEntryDialog.tsx
│   ├── EmptyState.tsx
│   ├── EntryForm.tsx
│   ├── EntrySummary.tsx
│   ├── EntryTable.tsx
│   ├── ErrorBoundary.tsx
│   ├── FeedbackDialog.tsx
│   ├── FlowMap.tsx
│   ├── FormDrawer.tsx
│   ├── GateEfficiencySection.tsx
│   ├── GlobalSearch.tsx
│   ├── KeyboardShortcutsHelp.tsx
│   ├── KPICard.tsx
│   ├── KPIChart.tsx
│   ├── KPIDashboard.tsx
│   ├── KPIMonthSelector.tsx
│   ├── KPITable.tsx
│   ├── LanguageSelector.tsx
│   ├── LLMRouterKPISection.tsx
│   ├── MetricCard.tsx
│   ├── OfflineBanner.tsx
│   ├── OrigemTypeSection.tsx
│   ├── OwnerSection.tsx
│   ├── Pagination.tsx
│   ├── ProgramSection.tsx
│   ├── ProtectedRoute.tsx
│   ├── SaleForm.tsx
│   ├── SaleMetrics.tsx
│   ├── SaleSimulator.tsx
│   ├── SaleTable.tsx
│   ├── SkeletonLoader.tsx
│   ├── Sparkline.tsx
│   ├── ThemeToggle.tsx
│   └── TransferForm.tsx
├── contexts/
│   ├── DataContext.tsx
│   ├── I18nContext.tsx
│   └── OnlineContext.tsx
├── features/
│   ├── alerts/
│   │   ├── addAccountAlert.ts
│   │   ├── alertsApi.ts
│   │   ├── getAccountAlerts.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── shared.ts
│   │   └── toggleAccountAlert.ts
│   ├── api/
│   │   ├── baseApi.ts
│   │   └── index.ts
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── authSlice.ts
│   │   └── index.ts
│   ├── clientes/
│   │   ├── addClient.ts
│   │   ├── clientesApi.ts
│   │   ├── deleteClient.ts
│   │   ├── getClients.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── mutationHooksBasic.ts
│   │   ├── mutationHooksLifecycle.ts
│   │   ├── shared.ts
│   │   └── updateClient.ts
│   ├── contas/
│   │   ├── addAccount.ts
│   │   ├── contasApi.ts
│   │   ├── deleteAccount.ts
│   │   ├── getAccounts.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── mutationHooksBasic.ts
│   │   ├── mutationHooksLifecycle.ts
│   │   ├── recalcAccount.ts
│   │   ├── shared.ts
│   │   └── updateAccount.ts
│   ├── entradas/
│   │   ├── addEntry.ts
│   │   ├── confirmEntry.ts
│   │   ├── deleteEntry.ts
│   │   ├── entradasApi.ts
│   │   ├── getEntries.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── mutationHooksBasic.ts
│   │   ├── mutationHooksLifecycle.ts
│   │   ├── shared.ts
│   │   └── updateEntry.ts
│   ├── origemTypes/
│   │   ├── addOrigemType.ts
│   │   ├── deleteOrigemType.ts
│   │   ├── getOrigemTypes.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── mutationHooksLifecycle.ts
│   │   ├── origemTypesApi.ts
│   │   ├── shared.ts
│   │   └── updateOrigemType.ts
│   ├── owners/
│   │   ├── addOwner.ts
│   │   ├── deleteOwner.ts
│   │   ├── getOwners.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── mutationHooksLifecycle.ts
│   │   ├── ownersApi.ts
│   │   ├── shared.ts
│   │   └── updateOwner.ts
│   ├── programs/
│   │   ├── addProgram.ts
│   │   ├── deleteProgram.ts
│   │   ├── getPrograms.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── mutationHooksLifecycle.ts
│   │   ├── programsApi.ts
│   │   ├── shared.ts
│   │   └── updateProgram.ts
│   ├── vendas/
│   │   ├── addVenda.ts
│   │   ├── cancelVenda.ts
│   │   ├── deleteVenda.ts
│   │   ├── getVendas.ts
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── mutationHooksBasic.ts
│   │   ├── mutationHooksLifecycle.ts
│   │   ├── shared.ts
│   │   ├── updateVenda.ts
│   │   └── vendasApi.ts
│   └── store.ts
├── hooks/
│   ├── useDatabase/
│   │   ├── index.ts
│   │   ├── mappers.ts
│   │   └── shared.ts
│   ├── use-mobile.tsx
│   ├── useClientCycleAvailability.ts
│   ├── useDatabase.ts
│   ├── useDebounce.ts
│   ├── useHaptic.ts
│   ├── useKeyboardShortcuts.ts
│   └── useSmartQuery.ts
├── lib/
│   ├── accountActivity.ts
│   ├── accounts.ts
│   ├── auto-classify.ts
│   ├── businessSeries.ts
│   ├── dates.ts
│   ├── dateUtils.ts
│   ├── i18n.ts
│   ├── logger.ts
│   ├── metrics.ts
│   ├── origemTypes.ts
│   ├── recurrence.ts
│   ├── sort.ts
│   ├── supabase-types.ts
│   ├── supabase.ts
│   ├── text-to-query.ts
│   ├── transferCalc.ts
│   ├── utils.ts
│   ├── workflowData.ts
│   └── workflowDemoData.ts
├── pages/
│   ├── AdminEventos.tsx
│   ├── Clientes.tsx
│   ├── Configuracoes.tsx
│   ├── Contas.tsx
│   ├── ControleCPF.tsx
│   ├── Dashboard.tsx
│   ├── Entradas.tsx
│   ├── ForgotPassword.tsx
│   ├── KPI.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── Perfil.tsx
│   ├── Relatorios.tsx
│   ├── ResetPassword.tsx
│   ├── Vendas.tsx
│   └── Workflow.tsx
├── types/
│   ├── index.ts
│   └── kpi.ts
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```
<!-- STRUCTURE-END -->

## 🤖 Índice Auto-Gerado (pre-pr)

Docs novos registrados automaticamente pelo pre-pr (marcação `(auto)` — mova para a tabela curada acima se pertinente):

| Arquivo | Registrado em |
|---------|---------------|
| `docs/tasks/AGENTS.override.md` (auto) | 2026-08-07 |
| `docs/superpowers/plans/2026-07-15-context-optimization-plan.md` (auto) | 2026-08-07 |
| `docs/tasks/P0-07-resolve-drift-docs.md` (auto) | 2026-08-07 |
| `docs/superpowers/plans/2026-08-07-card-ultimo-registro-alertas.md` (auto) | 2026-08-07 |
| `docs/superpowers/specs/2026-08-07-card-ultimo-registro-alertas-design.md` (auto) | 2026-08-07 |
| `docs/RULES.md` (auto) | 2026-08-09 |
| `docs/superpowers/specs/2026-08-09-navigation-gate-design.md` (auto) | 2026-08-09 |
| `docs/CONTEXT-MANAGEMENT.md` (auto) | 2026-08-09 |
| `docs/conventions/common.md` (auto) | 2026-08-09 |
| `docs/conventions/refactor.md` (auto) | 2026-08-09 |
| `docs/conventions/feature.md` (auto) | 2026-08-09 |
| `docs/conventions/bugfix.md` (auto) | 2026-08-09 |
| `docs/conventions/workflow.md` (auto) | 2026-08-09 |
| `docs/superpowers/specs/2026-08-09-conventions-split-design.md` (auto) | 2026-08-09 |
| `docs/superpowers/specs/2026-08-09-p2-21-metrics-design.md` (auto) | 2026-08-09 |
| `docs/metrics/2026-08-09-metrics.md` (auto) | 2026-08-09 |
| `docs/superpowers/plans/2026-08-09-p2-21-metrics.md` (auto) | 2026-08-09 |
| `docs/tasks/P2-21-metricas-programa.md` (auto) | 2026-08-10 |
| `docs/tasks/P3-28-blueprint-v4-p1-entradas.md` (auto) | 2026-08-10 |
| `docs/tasks/P3-29-blueprint-v4-p1-contas.md` (auto) | 2026-08-10 |
| `docs/tasks/P3-30-blueprint-v4-p1-clientes.md` (auto) | 2026-08-10 |
| `docs/tasks/P3-31-blueprint-v4-p1-vendas.md` (auto) | 2026-08-10 |
| `docs/tasks/P3-32-blueprint-v4-p1-alerts.md` (auto) | 2026-08-11 |
| `docs/tasks/P3-33-blueprint-v4-p1-owners.md` (auto) | 2026-08-11 |
| `docs/tasks/P3-34-blueprint-v4-p1-programs.md` (auto) | 2026-08-11 |
| `docs/tasks/P3-35-blueprint-v4-p1-origem-types.md` (auto) | 2026-08-11 |
| `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-entradas-design.md` (auto) | 2026-08-10 |
| `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-contas-design.md` (auto) | 2026-08-10 |
| `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-clientes-design.md` (auto) | 2026-08-10 |
| `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-vendas-design.md` (auto) | 2026-08-11 |
| `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-alerts-design.md` (auto) | 2026-08-11 |
| `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-owners-design.md` (auto) | 2026-08-11 |
| `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-origem-types-design.md` (auto) | 2026-08-11 |
| `docs/superpowers/specs/2026-08-10-blueprint-v4-p1-programs-design.md` (auto) | 2026-08-11 |
| `docs/WORKFLOW-QUICKSTART.md` (auto) | 2026-08-12 |
| `docs/AI-SESSION-STATE.md` (auto) | 2026-08-14 |
| `docs/adr/ADR-001-blueprint-v9-governanca.md` (auto) | 2026-08-14 |
| `docs/GRAPH-INTELLIGENCE.md` (auto) | 2026-08-15 |
| `docs/p11-baseline.md` (auto) | 2026-08-15 |
| `docs/P12-REAL-WORLD-EVIDENCE-REPORT.md` (auto) | 2026-08-15 |
| `docs/P13-EVIDENCE-DRIVEN-ROADMAP.md` (auto) | 2026-08-15 |
| `docs/p12-baseline.md` (auto) | 2026-08-15 |
