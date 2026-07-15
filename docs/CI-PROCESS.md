# 🔄 Melhoria Contínua — MilesControl

> Este documento define o processo de melhoria contínua do projeto.
> Aderência: obrigatória para sprints, recomendada para ciclos regulares.

---

## 📋 Ciclo de Melhoria

```
┌─────────────────────────────────────────────────────────────────┐
│                         Melhoria Contínua                        │
├──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│ Coletar  │ Priorizar│ Executar │ Revisar  │ Retrospectiva        │
│ Dados    │          │          │          │                      │
├──────────┼──────────┼──────────┼──────────┼──────────────────────┤
│ Feedbacks│ Council  │ Branch → │ Code     │ npm run retro --write│
│ IDEIAS.md│ → PR     │ Review   │          │                      │
│ GitHub   │ Backlog  │ Pre-PR   │ Handoff  │ docs/retro/          │
│ Issues   │          │ → Deploy │          │                      │
└──────────┴──────────┴──────────┴──────────┴──────────────────────┘
```

---

## 1. 📥 Coleta de Dados

Toda fonte de insumo é verificada no início de cada sessão:

| Fonte | O que | Frequência | Ferramenta |
|-------|-------|------------|------------|
| **Feedbacks do app** | Feedbacks de usuários | Cada sessão | `npm run feedback:check` |
| **IDEIAS.md** | Ideias externas e sugestões | Cada sessão | Leitura manual / `npm run think` |
| **GitHub Issues** | Bugs reportados | Cada sessão | `gh issue list` |
| **Relatórios HTML** | Métricas de PRs anteriores | Pós-PR | `docs/reports/` |
| **Retrospectivas** | Análise periódica de métricas | Semanal / Pós-sprint | `npm run retro` |

## 2. 🎯 Priorização

Os insumos são priorizados pelo **Council** (ver `WORKFLOW.md`):

| Critério | Peso | Exemplo |
|----------|------|---------|
| 🐛 Bug (severidade alta) | 🔴 Prioritário | Impede funcionalidade core |
| 🔧 Melhoria (feedback alto) | 🟡 Médio | Vários usuários pediram |
| ✨ Feature (alinhamento) | 🟢 Normal | Alinhado com roadmap |
| 📝 Docs / Chore | ⚪ Baixo | Manutenção de docs |

**Processo:** Council decide o que fazer → Superpowers executa → PR → Deploy.

## 3. ⚡ Execução

Segue o workflow padrão (`docs/WORKFLOW.md`):

1. Council (se necessário)
2. Branch → implementação → `npm run pre-pr` → relatório → PR
3. CI → Merge → Deploy
4. Handoff atualizado

## 4. 🔍 Revisão Pós-Implementação

Após cada merge:

- [ ] `npm run health:deploy` — deploy bem-sucedido?
- [ ] Relatório HTML em `docs/reports/` com prefixo `PR{num}`?
- [ ] Feedback mapeado como `done` no Supabase?
- [ ] Handoff atualizado com progresso?

## 5. 📊 Retrospectiva Periódica

### Comando

```bash
npm run retro --write               # últimas 2 semanas (padrão)
npm run retro --days 30 --write      # últimos 30 dias
npm run retro --period "2026-06-01..2026-06-30" --write  # período específico
```

### O relatório gera:

| Métrica | O que mede |
|---------|------------|
| PRs mergeados | Volume de entregas |
| Feedbacks resolvidos | Engajamento com usuários |
| CI success rate | Qualidade do código |
| Deploy success rate | Estabilidade da entrega |
| PRs por tipo | Distribuição (fix vs feat vs chore) |

### Periodicidade recomendada

| Tipo | Frequência | Gatilho |
|------|------------|---------|
| Mini-retro | A cada 5+ PRs | `npm run retro --days 7` |
| Sprint retro | Fim de sprint/bloco | `npm run retro --period <inicio>..<fim>` |
| Mensal | Fechamento do mês | `npm run retro --days 30` |

## 6. 🗺️ Mapeamento Feedbacks → PRs

Para rastreabilidade, feedbacks são ligados a PRs via comentário no GitHub:

```bash
gh pr comment <PR> --body "Resolve feedback #<id>"
```

Ou registrado no commit message:
```
fix: corrige entrada recorrente sem data (resolve feedback #73d7484b)
```

---

## 📈 Indicadores de Saúde

Monitorar ao longo do tempo:

| Indicador | Alvo | Como medir |
|-----------|------|------------|
| Deploy success rate | ≥ 95% | `npm run health:deploy` |
| CI success rate (main) | 100% | Últimos 20 runs |
| Feedbacks resolvidos/sprint | ≥ 2 | `npm run retro` |
| PRs sem relatório | 0 | Relatórios por PR |
| Tempo entre PR e deploy | < 30min | GitHub API |

---

## 🔧 Scripts de Melhoria Contínua

| Script | Atalho | Função |
|--------|--------|--------|
| `scripts/retro.mjs` | `npm run retro` | Gera retrospectiva do período |
| `scripts/check-deploy.mjs` | `npm run health:deploy` | Verifica status do último deploy |
| `scripts/rules/rule-22-pr-naming.mjs` | (auto no pre-pr) | Valida nomenclatura de PRs |

---

*Documento mantido em `docs/CI-PROCESS.md`*
