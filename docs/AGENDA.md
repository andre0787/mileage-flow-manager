# 📋 Agenda — MilesControl

> Sprint board do projeto. Mantenha atualizado: toda tarefa nova vira checkbox,
> toda finalizada é movida pra ✅.

---

## 🎯 Meta da Sprint (COMPLETA ✅)

Todos os bugs #1–#5 resolvidos, bateria verde.

---

## ✅ Resolvidos nesta sprint

- [x] **#1 — Overflow após confirmar entrada** — mutation `.single()`→`.maybeSingle()`, seletores corrigidos, waitForTimeout reduzidos, retries 0 ✅
- [x] **#2 — Coluna Origem sem nome na aba Pontos** — já corrigido no commit `feat: clube de milhas` (`origemTypeName` faz lookup em `origemTypes` primeiro, fallback pra `programs`). Todas as 4 posições na tabela usam a função correta. ✅
- [x] **#3 — Testar transferência com bônus manualmente** — fluxo test cria transferência 20k com 50% bônus e verifica saldos 50k/30k ✅
- [x] **#4 — Limpeza de arquivos temporários** — fluxo test roda completo (34.6s), relatório atualizado, screenshots limpos ✅
- [x] **#5 — Bateria pré-deploy completa** — build (4.63s) + todos os 8 testes (2.2 min) ✅

### 🟡 Pendências Técnicas

Nenhuma no momento.



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
