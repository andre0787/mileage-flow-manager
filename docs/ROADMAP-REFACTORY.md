# 🗺️ ROADMAP DE REFATORAÇÃO E OTIMIZAÇÃO

Plano mestre de execução detalhado em tarefas atômicas para as Fases A até E.

---

## 📋 Checklist Geral

- [x] **Setup Inicial**
  - [x] Iniciar sessão com `npm run session:start`
  - [x] Criar branch de trabalho `refactor/master-plan-optimization`
  - [x] Documentar Roadmap em `docs/ROADMAP-REFACTORY.md`

---

## 📋 FASE A: Otimização de Dados Estáticos (`workflowStaticData.ts`)
**Objetivo:** Manter os dados de Workflow fora do bundle TypeScript, carregando JSON estático sob demanda.

- [ ] **A.1** Criar diretório `public/mock/`
- [ ] **A.2** Extrair os dados estáticos de Workflow para `public/mock/workflow-fallback.json`
- [ ] **A.3** Criar/Centralizar interfaces e tipos em `src/types/workflow.ts`
- [ ] **A.4** Refatorar `src/lib/workflowData.ts` para remover dependências dos dados antigos, carregar JSON dinamicamente e fornecer fallback estrutural seguro
- [ ] **A.5** Atualizar componentes em `src/components/workflow/` (`WorkflowGates`, `WorkflowHero`, `WorkflowJourney`, `WorkflowMindMap`, `WorkflowSimulator`, `WorkflowTimeline`) para consumir dados via `workflowData.ts` / JSON / tipos
- [ ] **A.6** Consolidar os dados em `src/lib/workflowStaticData.ts` e atualizar testes unitários (`tests/unit/workflowData.test.ts`, `tests/unit/WorkflowEfficiency.test.ts`)
- [ ] **A.7** Executar validações (`npm run typecheck`, `npm run build`, `npm test`)

---

## 📋 FASE B: Telemetria Resiliente com Fila Local e Retry
**Objetivo:** Garantir resiliência offline e persistência em falhas para registros de telemetria IA.

- [ ] **B.1** Criar `src/lib/telemetryQueue.ts` com funções `saveToQueue`, `flushTelemetryQueue` e `recordTelemetry` usando `localStorage`
- [ ] **B.2** Criar testes unitários para `src/lib/telemetryQueue.ts` em `tests/unit/telemetryQueue.test.ts` (Rule-31)
- [ ] **B.3** Integrar `flushTelemetryQueue()` no ciclo de vida da aplicação em `src/App.tsx` (via `useEffect` na inicialização e eventos online)
- [ ] **B.4** Refatorar `src/lib/aiTelemetry.ts` para integrar com a nova fila resiliente `recordTelemetry()`
- [ ] **B.5** Validar tipagem e build (`npm run typecheck`, `npm test`, `npm run build`)

---

## 📋 FASE C: Auditoria e Limpeza de Código Órfão e Scripts
**Objetivo:** Identificar e limpar dead code, garantir Rule-16 (100% scripts em package.json) e deduplicar métricas.

- [ ] **C.1** Auditar exports em `src/lib/`, remover os não utilizados e documentar em `docs/audit/dead-exports.md`
- [ ] **C.2** Auditar `scripts/` vs `package.json`, adicionar atalhos faltantes no `package.json` e documentar em `docs/audit/npm-scripts-added.md`
- [ ] **C.3** Auditar e deduplicar lógicas redundantes entre `src/lib/metrics.ts` e `src/lib/transferCalc.ts`, documentando em `docs/audit/deduplication.md`
- [ ] **C.4** Executar verificação de arquivos órfãos (Rule-14) e limpar se houver
- [ ] **C.5** Validar linters e tipagem (`npm run typecheck`, `npm run lint`)

---

## 📋 FASE D: Otimização de Empacotamento de Contexto LLM
**Objetivo:** Reduzir tokens consumidos pelo script de contexto (`context-pack.mjs`) em ≥30%.

- [ ] **D.1** Analisar `scripts/context-pack.mjs` e adicionar padrões de exclusão explícitos (`public/mock/`, relatórios antigos, artefatos pesados)
- [ ] **D.2** Implementar filtro de exclusão por tamanho (>15KB por padrão) e anotações `@llm-context: skip-unless-requested`
- [ ] **D.3** Testar geração de contexto antes e depois da otimização
- [ ] **D.4** Documentar ganhos de redução de contexto em `docs/audit/context-optimization.md`

---

## 📋 FASE E: Atualização Workflow e KPIs com Dados Reais e Recharts
**Objetivo:** Conectar as abas de Workflow e KPIs a métricas reais do repositório/sessão com visualizações Recharts.

- [ ] **E.1** Criar hook `src/hooks/useWorkflowMetrics.ts` com polling/refresh a cada 30s e suporte a dados locais e remotos
- [ ] **E.2** Criar testes para o hook em `tests/unit/useWorkflowMetrics.test.ts` (Rule-32)
- [ ] **E.3** Refatorar aba/página `Workflow` para consumir métricas em tempo real do hook
- [ ] **E.4** Refatorar aba/página `KPIs` com 4 metric cards, 2 gráficos Recharts (Custo e Lead Time) e alerta de Pre-PR pass rate
- [ ] **E.5** Executar validações completas (`npm run typecheck`, `npm run lint`, `npm run build`, `npm test`)

---

## 📋 FASE F: Verificação Final e Quality Gates
- [ ] **F.1** Executar `npm run pre-pr` com todas as regras e gates Fable/MilesControl
- [ ] **F.2** Garantir relatório HTML gerado e git status limpo
