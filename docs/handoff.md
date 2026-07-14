# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-13
> Anterior: 2026-07-13
---
## 🧭 Estado Atual
- **Branch:** `main`
- **Último commit:** `af67af5` — Merge PR #130: feat: rule #18 — no duplicate .md between root and docs/
- **Remote:** origin/main
### 📋 PRs Abertos
Nenhum PR aberto.
### 📊 Métricas (estimativa local)
| Métrica | Valor |
|---------|-------|
| Total testes | 108 |
| Docs issues | 0 |
| Branch | main |

---
_Atualizado automaticamente por `scripts/update-handoff.mjs`_
## 🧠 Notas da Sessão Atual
(Adicione notas manuais abaixo desta linha)
### 🔜 Próxima Sessão

**Missão:** Criar PR com as correções de bugs reportados por usuários.

### ✅ Correções Aplicadas (branch `fix/user-reported-bugs`)

**Cache invalidation (4 bugs):**
- Root cause: `invalidateQueries` com `refetchType: 'active'` (default) não refetchava queries no TanStack Query v5
- Fix: `refetchType: 'all'` em 33 chamadas em 8 arquivos
- Arquivos: `entries.ts`, `accounts.ts`, `programs.ts`, `origemTypes.ts`, `owners.ts`, `clients.ts`, `sales.ts`, `shared.ts`, `DataContext.tsx`

**Dashboard saldo incorreto:**
- Consequência do cache invalidation — corrigido junto

**Input fora de visibilidade (mobile):**
- Root cause: `max-h-[60/70vh] overflow-y-auto` dentro de FormDrawer (que já tem scroll) criava nested scroll
- Fix: removido `max-h` dos formulários
- Arquivos: `EntryForm.tsx`, `TransferForm.tsx`, `SaleForm.tsx`

**Botão reportar footer:**
- Root cause: PR #118 removeu link quebrado mas não adicionou substituto
- Fix: adicionado `FeedbackDialog` no BottomTabBar
- Arquivo: `BottomTabBar.tsx`

**Pendente:** Criar PR, gerar relatório, executar `npm run post-pr`.





