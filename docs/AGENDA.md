# 📋 Agenda — MilesControl

> Sprint board do projeto. Mantenha atualizado: toda tarefa nova vira checkbox,
> toda finalizada é movida pra ✅.

---

## 🎯 Meta da Sprint

Corrigir bugs #1 e #2, limpeza de temporários e bateria pré-deploy.

---

## 🔄 Em Andamento

### 🟡 Pendências Técnicas

- [ ] **#1 — Overflow após confirmar entrada**
  Teste de fluxo morre com "Target page closed" após clicar em Confirmar.
  Suspeita: mutation chamado corretamente mas `calcAccountUpdate` ou RLS
  pode causar erro silencioso que derruba o React.

- [ ] **#2 — Coluna Origem sem nome na aba Pontos**
  Tabela usa `programs.find(p => p.id === entry.origemTypeId)?.name ?? "-"`
  mas `entry.origemTypeId` referencia `origem_types`, não `programs`.
  Correção: usar função de lookup correta.

- [ ] **#3 — Testar transferência com bônus manualmente**
  Criar transferência de 20.000 pts entre contas com 50% bônus.
  Verificar: 30.000 na conta destino, 40.000 na origem, custo médio atualizado.

- [ ] **#4 — Limpeza de arquivos temporários**
  - `tests/fluxo-completo.spec.ts` — testar se roda até o fim após corrigir item 1
  - Screenshots de debug em `tests/screenshots/` — limpar se não forem mais necessários
  - `tests/fluxo-relatorio.md` — atualizar com resultados da próxima execução

- [ ] **#5 — Bateria pré-deploy completa**
  - `npm run build`
  - `npx playwright test tests/entradas.spec.ts tests/origem-tipo.spec.ts`
  - `npx playwright test tests/responsivo.spec.ts`
  - `npx playwright test tests/carrinho.spec.ts tests/clube.spec.ts`



---

## ✅ Finalizados (sprint atual)
- [x] `SPRINT_NEXT.md` deletado (conteúdo migrado pra AGENDA.md)
- [x] `progress.md` movido para `docs/`
- [x] `task_plan.md` movido para `docs/`
- [x] Estrutura `docs/` criada (9 arquivos modulares)
- [x] AGENTS.md enxugado para sumário executivo
- [x] MAP.md — índice entry point
- [x] AGENDA.md — sprint board
- [x] Convenção de branches: inglês + kebab-case + prefixos padronizados
- [x] Workflow council-to-superpowers documentado e instalado
- [x] Deletar `entradas-transferir.png`, `entradas-page.txt`, `bun.lockb`
- [x] Verificar e limpar `.playwright-mcp/`
- [x] Adicionar artifacts de debug ao `.gitignore` (test-results, screenshots, .playwright-mcp)
- [x] Relatório pós-implementação (CONVENTIONS.md + /report template)
- [x] Regra de escopo estrito (não alterar além do pedido)
- [x] Deploy: PR #27 → develop → main

---

## 📌 Backlog

- [ ] `feat/nova-funcionalidade` com council
- [ ] Template `/sprint` no `.pi/prompts/` para abrir AGENDA.md automaticamente
- [ ] Avaliar se algum doc cresceu demais e precisa ser dividido
