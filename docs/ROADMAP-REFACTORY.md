# 🗺️ ROADMAP DE REFATORAÇÃO E OTIMIZAÇÃO

Plano mestre de execução detalhado em tarefas atômicas para as Fases A até F.

## 📋 Checklist Geral

- [x] **Setup Inicial**
  - [x] Iniciar sessão com `npm run session:start`
  - [x] Criar branch de trabalho (`refactor/master-plan-optimization` e correções em branch dedicada)
  - [x] Documentar Roadmap em `docs/ROADMAP-REFACTORY.md`

## 📋 FASE A: Otimização de Dados Estáticos (`workflowStaticData.ts`)
**Objetivo:** manter dados de Workflow fora do bundle TypeScript, carregando JSON estático sob demanda.

- [x] **A.1** Criar diretório `public/mock/`.
- [x] **A.2** Extrair dados para `public/mock/workflow-fallback.json`.
- [x] **A.3** Centralizar interfaces em `src/types/workflow.ts`.
- [x] **A.4** Refatorar `src/lib/workflowData.ts` com carregamento dinâmico e fallback estrutural.
- [x] **A.5** Atualizar componentes Workflow para consumir a nova fonte tipada.
- [x] **A.6** Consolidar `src/lib/workflowStaticData.ts` e testes unitários.
- [x] **A.7** Validar typecheck, build e testes.

**Evidências:** `public/mock/workflow-fallback.json`, `src/lib/workflowData.ts`, `src/lib/workflowStaticData.ts`, `src/types/workflow.ts` e testes Workflow.

## 📋 FASE B: Telemetria Resiliente com Fila Local e Retry
**Objetivo:** garantir resiliência offline e persistência em falhas para registros de telemetria IA.

- [x] **B.1** Criar `src/lib/telemetryQueue.ts` com `saveToQueue`, `flushTelemetryQueue` e `recordTelemetry`.
- [x] **B.2** Criar `tests/unit/telemetryQueue.test.ts` (Rule-31).
- [x] **B.3** Integrar `flushTelemetryQueue()` no ciclo de vida em `src/App.tsx`.
- [x] **B.4** Expor a integração resiliente pela API `src/lib/aiTelemetry.ts`, preservando a fila como camada de efeitos.
- [x] **B.5** Validar tipagem, testes e build.

**Evidências:** fila com retry/locks/fallback local, integração startup/online e testes unitários; persistência de envelopes continua fail-open.

## 📋 FASE C: Auditoria e Limpeza de Código Órfão e Scripts
**Objetivo:** identificar dead code, garantir Rule-16 e deduplicar métricas.

- [x] **C.1** Auditar exports em `src/lib/` e documentar em `docs/audit/dead-exports.md`.
- [x] **C.2** Auditar `scripts/` versus `package.json` e documentar em `docs/audit/npm-scripts-added.md`.
- [x] **C.3** Auditar/deduplicar métricas e documentar em `docs/audit/deduplication.md`.
- [x] **C.4** Executar verificação de órfãos (Rule-14).
- [x] **C.5** Validar lint e tipagem.

**Evidências:** auditorias versionadas, atalhos npm adicionados e pre-pr reportando Rule-14/15/16 sem erros.

## 📋 FASE D: Otimização de Empacotamento de Contexto LLM
**Objetivo:** reduzir tokens consumidos pelo `context-pack.mjs` em ≥30%.

- [x] **D.1** Adicionar exclusões explícitas para `public/mock/`, relatórios antigos e artefatos pesados.
- [x] **D.2** Implementar filtro por tamanho (>15KB) e anotações `@llm-context: skip-unless-requested`.
- [x] **D.3** Testar geração de contexto antes/depois.
- [x] **D.4** Documentar ganhos em `docs/audit/context-optimization.md`.

**Evidências:** `graph:context` reportou redução aproximada de 92% no packet da validação final.

## 📋 FASE E: Atualização Workflow e KPIs com Dados Reais e Recharts
**Objetivo:** conectar Workflow/KPIs a métricas reais com visualizações Recharts.

- [x] **E.1** Criar `src/hooks/useWorkflowMetrics.ts` com refresh de 30s e fallback local/remoto.
- [x] **E.2** Criar testes do hook em `tests/unit/useWorkflowMetrics.test.ts`.
- [x] **E.3** Refatorar Workflow para consumir métricas reais do hook.
- [x] **E.4** Manter KPIs com cards, gráficos Recharts e alerta de pre-pr pass rate usando dados reais existentes.
- [x] **E.5** Executar typecheck, lint, build e testes.

**Evidências:** `WorkflowEfficiency`, `KPIDashboard`, `KPIChart`, `ProcessDailySection`, `AiCostSection` e dados públicos gerados por refresh.

## 📋 FASE F: Verificação Final e Quality Gates

- [x] **F.1** Executar `npm run pre-pr` com regras e gates Fable/MilesControl.
- [x] **F.2** Gerar relatório HTML e garantir status limpo antes do PR/merge.

**Evidências:** PR #482 mergeado e deploy de produção concluído; esta branch contém apenas as correções adicionais e terá PR separado.

## 🔧 Correções adicionais desta revisão

- [x] Validar `model` após `trim`, rejeitando vazio e `unset` com espaços.
- [x] Limitar `computeSuccessRate` e overrides de `successRate` a `0..1`.
- [x] Corrigir locator do smoke E2E para selecionar o combobox visível sem strict mode violation.
