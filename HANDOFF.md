# HANDOFF — Milage Flow Manager

> ⏰ Última atualização: 2026-07-11 — Sessão Pós-PR #85

---

## 🧭 Estado Atual

### 🔴 Branch atual
- `main` (PR #85 mergeado, branch `fix/bugs-77-78` deletada)

### 🎯 O que foi feito nesta sessão

| O quê | Status |
|-------|--------|
| #77 — Erro silencioso (onError + toast) | ✅ mergeado |
| #78 — Race condition tipo origem | ✅ mergeado |
| Filtro "Transferência" do dropdown | ✅ mergeado |
| Prevenção de duplo clique | ✅ mergeado |
| Race condition cliente (mutateAsync) | ✅ mergeado |
| Modo Split/Repeat na recorrência | ✅ mergeado |
| Teste flaky de timezone corrigido | ✅ mergeado |
| **PR #85** | ✅ **MERGEADO** |
| Issues #77, #78 fechadas | ✅ |
| Issue #86 — Editar Vendas (criada) | ✅ aberta |
| AGENDA.md atualizada | ✅ |

### 📋 Próximas pendências

#### Sprint B — Limpeza & Confiabilidade 🟡
- [ ] Arquivar 29 docs órfãos em `docs/archive/`
- [ ] Config cross-harness (`.opencode/`, `.claude/`)
- [ ] Script `scripts/verify-docs.mjs`
- [ ] Atualizar docs núcleo (AGENTS.md, CONVENTIONS.md, WORKFLOW.md)

#### Sprint C — Polimento & Prevenção 🟢
- [ ] Varredura automática no CI
- [ ] Dashboard de qualidade
- [ ] Relatório HTML automático
- [ ] HANDOFF.md automatizado

#### Issues abertas
- [ ] #86 — FEATURE: Editar Vendas

### 📊 Métricas

| Métrica | Valor |
|---------|-------|
| Testes unitários | 45/45 ✅ |
| Testes E2E | 54/54 ✅ |
| CI/CD | ✅ |
| Deploy | ✅ Automático Vercel |
| Último PR | #85 |
| Último deploy | Vercel (main) |

---

## 🧠 Contexto técnico

### Recorrência Split/Repeat
Dois modos implementados no formulário de entrada:
- **Parcelado**: `amount / recurrenceCount` antes de `mutate()`, em `handleCreateEntry`
- **Repetido**: valor cheio em cada parcela (comportamento original)
- `recurrenceValueMode` serializado na description e propagado em `calculateRecurrence`

### Bugs corrigidos
- **#77**: `onError` adicionado em 3 mutations (entries.ts, Entradas.tsx, Vendas.tsx)
- **#78**: `mutateAsync` em vez de `mutate` para criar tipo origem inline
- **Race condition cliente**: `handleCreateClient` async com `mutateAsync`

### Limpeza pós-sessão
- PR #85 mergeado, branch deletada
- Issues #77, #78 fechadas
- AGENDA.md atualizado com estado real
