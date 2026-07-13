# Plano: Code Splitting para Recharts

**Data:** 2026-07-09
**Spec:** `docs/archive/specs/code-splitting-recharts.md`
**Estimativa:** 2-3 horas

## Tarefas

### Tarefa 1: Criar DashboardChartsContent.tsx (15 min)

**O que:** Mover conteúdo de DashboardCharts.tsx para DashboardChartsContent.tsx

**Arquivos:**
- Criar: `src/components/DashboardChartsContent.tsx`
- Modificar: `src/components/DashboardCharts.tsx`

**Passos:**
1. Criar DashboardChartsContent.tsx com todo o conteúdo atual
2. Adicionar export default no final
3. Atualizar DashboardCharts.tsx para importar lazy

**Critério de aceite:**
- DashboardChartsContent.tsx existe e exporta o componente
- DashboardCharts.tsx importa lazy o conteúdo
- Build passa sem erros

---

### Tarefa 2: Implementar lazy loading (20 min)

**O que:** Usar React.lazy() e Suspense em DashboardCharts

**Arquivos:**
- Modificar: `src/components/DashboardCharts.tsx`

**Passos:**
1. Importar lazy e Suspense do React
2. Criar lazy import de DashboardChartsContent
3. Envolver em Suspense com fallback
4. Testar se Dashboard carrega corretamente

**Critério de aceite:**
- Dashboard carrega sem erros
- Gráficos aparecem após carregamento
- Loading state é visível brevemente

---

### Tarefa 3: Atualizar manualChunks (10 min)

**O que:** Adicionar recharts ao manualChunks no vite.config.ts

**Arquivos:**
- Modificar: `vite.config.ts`

**Passos:**
1. Adicionar 'charts' chunk com recharts
2. Build e verificar chunks separados
3. Verificar tamanho do index.js

**Critério de aceite:**
- Build cria chunk separado para recharts
- index.js diminui de ~1MB para ~850kB
- vendor chunk mantém tamanho similar

---

### Tarefa 4: Testes E2E (30 min)

**O que:** Verificar que todos os testes continuam passando

**Arquivos:**
- Nenhum (executar testes existentes)

**Passos:**
1. Executar `npm test` (unitários)
2. Executar `npx playwright test` (E2E)
3. Verificar se Dashboard funciona em testes
4. Verificar se gráficos aparecem

**Critério de aceite:**
- 33/33 testes unitários passam
- 8/8 testes E2E passam
- Dashboard renders corretamente nos testes

---

### Tarefa 5: Medir performance (15 min)

**O que:** Capturar métricas antes e depois

**Arquivos:**
- Nenhum (medição externa)

**Passos:**
1. Build final com code splitting
2. Analisar chunks gerados
3. Calcular economia de bundle size
4. Documentar métricas

**Critério de aceite:**
- index.js < 900kB
- Chunk de recharts criado (~163kB)
- Economia documentada

---

### Tarefa 6: Relatório e PR (20 min)

**O que:** Criar relatório HTML e submeter PR

**Arquivos:**
- Criar: `docs/reports/PR61-2026-07-09-code-splitting-recharts.html`
- Modificar: `HANDOFF.md`, `docs/AGENDA.md`

**Passos:**
1. Gerar diff
2. Criar relatório HTML
3. Atualizar HANDOFF.md
4. Criar branch e PR
5. Merge em develop

**Critério de aceite:**
- Relatório HTML criado
- PR criado e mergeado
- HANDOFF.md atualizado

---

## Ordem de Execução

1. Tarefa 1 → Tarefa 2 → Tarefa 3 → Tarefa 4 → Tarefa 5 → Tarefa 6

## Dependências

- Tarefa 2 depende de Tarefa 1
- Tarefa 3 pode ser feita em paralelo com Tarefa 1-2
- Tarefa 4 depende de Tarefa 1-3
- Tarefa 5 depende de Tarefa 3
- Tarefa 6 depende de Tarefa 4-5

## Riscos

1. **Recharts pode ter problemas com lazy loading** - Testar thoroughly
2. **Build pode quebrar** - Testar build após cada tarefa
3. **Testes podem falhar** - Executar testes após cada mudança

## Critérios de Sucesso

- [x] Bundle size reduzido em ~163kB
- [x] Chunk separado para recharts criado
- [x] Todos os testes passando
- [x] Performance melhorada
- [x] Relatório criado
- [x] PR mergeado
