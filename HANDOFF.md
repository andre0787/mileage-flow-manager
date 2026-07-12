# HANDOFF — MilesControl
> ⏰ Última atualização: 2026-07-11
---
## 🧭 Estado Atual
- **Branch:** `main`
- **Último commit:** `7191a43` — feat: integra logger em todas as mutations do useDatabase (#101)
- **Remote:** origin/main
- **Deploy Vercel:** Bloqueado até ~2026-07-12 (100 deploys/dia free esgotado)
- **Logger:** sempre ativo (padrão alterado para `true`)

### 📋 PRs Abertos
Nenhum PR aberto.

---

## 📦 PRs mergeados (sessões anteriores)

| PR | Descrição |
|----|-----------|
| **#92** | Sprint B + C (Limpeza & Confiabilidade + Polimento & Prevenção) |
| **#93** | Rename auto-report artifact to qualidade |
| **#95** | Badge/banner entradas só atrasadas |
| **#96** | Canal de Feedback (GitHub Issues + Formulário interno + Supabase) |
| **#97** | Pre-commit hook + validação automática de regras |
| **#98** | Botão de atalho Limpar Cache no sidebar |
| **#100** | Tasks VS Code para scripts do workflow |
| **#101** | Logger integrado em todas as mutations do useDatabase |

---

## 🧠 Sessão 2026-07-11 (features + validação)

### 🐞 Logger integrado
- `clients.ts`, `origemTypes.ts`, `owners.ts`, `programs.ts`, `sales.ts`: +logError + logDestructiveOp
- `accounts.ts`, `entries.ts`: complementar nas mutations faltantes
- **15+ mutations** agora registram erros estruturados
- Logger **sempre ativo** por padrão (desliga com `VITE_ENABLE_DEBUG_LOG=false`)
- Ativar debug: `console.table(JSON.parse(localStorage.getItem('mc_debug_logs')))`

### 🛡️ Validação automática de regras (PR #97)
- `scripts/lib.mjs` + `scripts/rules/rule-*.mjs` + `.githooks/pre-commit`
- 6 regras com validação automática (grid, branch, pt-BR, report, clean, validations)

### 🚀 Features novas
- **Feedback**: `FeedbackDialog.tsx`, tabela `feedback` no Supabase, RLS ajustada
- **Pre-commit hook**: bloqueia commits na main
- **Limpar Cache**: atalho no sidebar (`RotateCcw`)
- **Tasks VS Code**: `Ctrl+Shift+B` p/ Iniciar Sessão + 6 tasks no task runner

### ⚠️ Deploy bloqueado
Vercel free (100 deploys/dia) esgotado. Deploy automático roda quando resetar.

### 📋 Próximos passos
- [ ] Revisar feedbacks de usuários (2 pendentes)
- [ ] Monitorar deploy automático da Vercel
- [ ] Backlog: traduções, analytics, performance, PWA

---

### 📁 Estrutura de scripts

```
scripts/
├── lib.mjs                 ← utilitários compartilhados
├── check-feedback.mjs      ← consulta feedback de usuários
├── pre-pr-check.mjs        ← orquestrador (rules + build + test + docs)
├── rules/
│   ├── rule-02-grid.mjs
│   ├── rule-04-branch.mjs
│   ├── rule-07-ptbr.mjs
│   ├── rule-08-report.mjs
│   ├── rule-10-clean.mjs
│   └── rule-13-validations.mjs
├── generate-report.mjs
├── session-start.mjs
├── session-end.mjs
├── think.mjs
└── verify-docs.mjs
.githooks/pre-commit          ← bloqueia main
```
