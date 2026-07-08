# 📋 Agenda — MilesControl

> Sprint board do projeto. Mantenha atualizado: toda tarefa nova vira checkbox,
> toda finalizada é movida pra ✅.

---

## 🎯 Meta da Sprint

Corrigir bugs #1 e #2, limpeza de temporários e bateria pré-deploy.

---

## 🔄 Em Andamento

### ✅ Resolvidos nesta sprint

- [x] **#1 — Overflow após confirmar entrada** (FIX: mutation `.single()`→`.maybeSingle()`, parseDescription, onError; fluxo test: regex waitForURL, seletores #name/#pricePerMile, combobox venda, waitForTimeout reduzidos, retries 0)
- [x] **#3 — Testar transferência com bônus manualmente** — fluxo test cria transferência 20k com 50% bônus e verifica saldos 50k/30k ✅
- [x] **#4 — Limpeza de arquivos temporários** — fluxo test roda completo (34.6s), relatório atualizado, screenshots limpos
- [x] **#5 — Bateria pré-deploy completa** — build (4.63s) + todos os 8 testes (2.2 min) ✅

### 🟡 Pendências Técnicas

- [ ] **#2 — Coluna Origem sem nome na aba Pontos**
  Tabela usa `programs.find(p => p.id === entry.origemTypeId)?.name ?? "-"`
  mas `entry.origemTypeId` referencia `origem_types`, não `programs`.
  Correção: usar função de lookup correta.



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
