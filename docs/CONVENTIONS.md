# 📏 Convenções de Código — MilesControl

## Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | `PascalCase.tsx` | `MetricCard.tsx` |
| Utilitários | `camelCase.ts` | `formatCPF.ts` |
| Hooks | `camelCase.ts` | `useDebounce.ts` |
| Tipos | `index.ts` | `types/index.ts` |
| Import path | `@/` → `src/` | `@/components/MetricCard` |

**Interface:** português (pt-BR)

## Organização de Código

- **Business logic** → `src/lib/*.ts` (funções puras, sem React/Supabase)
- **Queries/mutations** → `src/hooks/useDatabase.ts`
- **Componentes de UI** → `src/components/`
- **Páginas** → `src/pages/`
- **Ponto único de alteração**: cada regra de negócio em 1 arquivo apenas

## DRY & Modularidade

- Nunca duplicar cálculo de lucro, margem, saldo, custo médio — cada um em ponto único em `lib/`
- Todo mapper snake_case → camelCase centralizado em `lib/utils.ts` ou no próprio módulo de domínio
- Preferir criar módulo novo a duplicar lógica existente

## React & Estado

- **DataContext**: apenas dados + isLoading + clearCache/clearAccountData. Mutations não ficam no contexto.
- **React Query**: staleTime 30s, invalidateQueries após mutations
- **Loading states**: usar `isPending` do TanStack Query
- **Ponytail mode**: stdlib/nativo primeiro, sem abstrações especulativas, código morto é removido

## shadcn/ui

- Só adicionar componente se realmente for usar
- Atualmente 19 mantidos: alert-dialog, badge, button, card, dialog, drawer, input, label, progress, select, separator, sheet, skeleton, sidebar, sonner, switch, table, tabs, tooltip
- Toast: não usar — app usa Sonner exclusivamente
- Seguir padrão do shadcn/ui para novos componentes

## Importações

```tsx
// ✅ Correto
import { MetricCard } from "@/components/MetricCard"
import { useDatabase } from "@/hooks/useDatabase"
import { formatCPF } from "@/lib/utils"

// ❌ Evitar
import { MetricCard } from "../../components/MetricCard"
```

## HANDOFF.md — Atualização Obrigatória Pós-PR

**Sempre que subir um PR (criar ou mergear), atualize o `HANDOFF.md`** com:
- Progresso atualizado (Done / In Progress / Pending)
- PRs criados/mergeados
- Branch atual
- Próximos passos

Isso garante continuidade entre sessões sem perda de contexto.

## Relatório Pós-Implementação — OBRIGATÓRIO

**Toda tarefa (feature ou manutenção) DEVE gerar um relatório HTML antes do PR.**
Passo final obrigatório do workflow (ver `WORKFLOW.md` etapa 8).

Use `/report` (template em `.pi/prompts/report.md`) que:
1. Obtém o diff: `git diff $(git merge-base HEAD origin/develop)..HEAD`
2. Extrai antes/depois, benefícios e estimativa de tokens
3. Gera HTML em `docs/reports/<data>-<nome>.html`
4. Versiona o relatório junto com o código

### O que o relatório deve conter:
- **Antes/Depois**: o que existia vs o que foi implementado (máx 3 linhas cada)
- **Benefícios**: tópicos do que melhorou (menos código, performance, UX, etc.)
- **Consumo de tokens**: estimado a partir do diff (~¾ token por linha)
- **Badges**: tipo da branch, PR, ambiente, data

### Nomenclatura — OBRIGATÓRIO: número da PR

O relatório DEVE começar com o número da PR: `docs/reports/<PR>-<data>-<nome>.html`

### Exemplos reais:
```
docs/reports/PR58-2026-07-09-bugfix-testes.html
docs/reports/PR55-2026-07-09-sprint4-csv-export.html
```

## Escopo Estrito

**Nunca modifique nada além do que foi pedido.** Se um arquivo precisar de
ajuste não solicitado (lint, formatação, refactor, renomear, deletar), pergunte
antes. "Já que estou aqui" gera diff imprevisível e quebra revisão.

Exceção: correções óbvias que impedem o código de funcionar (import faltando,
typo em variável, erro de sintaxe).

## Limpeza Pós-Sessão — OBRIGATÓRIA

**Antes de finalizar qualquer sessão ou subir PR, verifique `git status`.**

Regra: **zero arquivos uncommitted** ao sair. Isso inclui:
- Código fonte (`src/`)
- Documentação (`docs/`, `*.md` raiz)
- Dependências (`package.json`, `package-lock.json`)
- Relatórios (`docs/reports/`)
- Council verdicts (`docs/council/`)
- Plans & specs (`docs/superpowers/`)

**Checklist de saída:**
1. `git status` — verificar arquivos pendentes
2. `git add .` — stage tudo que foi criado/modificado
3. `git commit` — commitar com mensagem descritiva
4. `git push` — subir para o repositório
5. Atualizar `HANDOFF.md` com estado atual

**Exceção:** apenas arquivos em `.gitignore` (node_modules, .env, test-results/).

## Invariantes Financeiras — OBRIGATÓRIO

Toda operação que altera saldo de conta DEVE ter uma inversão espelhada testada.

**Regra:** Se `A` debitou X de uma conta, deletar `A` deve creditar X de volta.

```typescript
// ❌ ERRADO: reversal usa valor errado
await supabase.from("accounts").update({
  balance: balance + entry.amount,
  total_invested: total_invested + entry.amountPaid, // ← ERRADO para transferências
});

// ✅ CORRETO: reversal computa custo proporcional
const proportionalCost = calcProportionalCost(entry.amount, balance, totalInvested);
await supabase.from("accounts").update({
  balance: balance + entry.amount,
  total_invested: total_invested + proportionalCost,
});
```

**Arquivo de referência:** `src/lib/metrics.ts` — `calcProportionalCost()`
**Testes:** `tests/unit/invariants.test.ts`

## Imutabilidade de Estado — OBRIGATÓRIO

Nunca mutar arrays ou objetos que vêm de `useMemo` ou `useState`.

```typescript
// ❌ ERRADO: .sort() muta o array original
{ownerReports.sort((a, b) => b.roi - a.roi)[0]}

// ✅ CORRETO: cria cópia antes de ordenar
{[...ownerReports].sort((a, b) => b.roi - a.roi)[0]}
```

**Por que:** React compara referências. Mutar um array memoizado pode causar re-renders perdidos ou comportamento imprevisível.

## Promessas de UI — OBRIGATÓRIO

Se a UI mostra uma mensagem ao usuário, o código DEVE cumprir a promessa.

```tsx
// ❌ ERRADO: UI diz "Transferência será preservada" mas código deleta tudo
<p>O tipo "Transferência" será preservado.</p>
// ...mas clearAccountData deleta origem_types inteiro

// ✅ CORRETO: código preserva o que a UI promete
await supabase.from("origem_types").delete().not("id", "is", null);
await supabase.from("origem_types").insert({ name: "Transferência", ... }); // re-insere
```

**Checklist:** Antes de merge, verificar se alguma mensagem de UI promete algo que o código não entrega.

## Config Global — NÃO DUPLICAR

Configurações definidas no `QueryClient` global (`App.tsx`) NÃO devem ser repetidas em queries individuais.

```typescript
// ❌ ERRADO: repete o que já está no QueryClient global
useQuery({
  queryKey: ["entries"],
  staleTime: 30 * 1000, // ← já está no App.tsx
});

// ✅ CORRETO: herda do global
useQuery({
  queryKey: ["entries"],
});
```

**Exceção:** se uma query precisa de staleTime DIFERENTE do global, aí sim pode override.

## Observações Gerais

- Não adicionar dependências sem necessidade
- Manter consistência do design system (cores, sombras, animações)
- Todas as queries e mutations usam React Query com invalidateQueries
- Supabase RLS policies por user_id (auth.uid())
- Tokens armazenados em ~/.config/opencode/tokens.json (gitignored)
