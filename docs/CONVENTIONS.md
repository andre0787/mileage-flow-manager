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

## Relatório Pós-Implementação

**Toda tarefa (feature ou manutenção) DEVE gerar um relatório HTML** com:
- Antes/Depois: o que existia vs o que foi implementado
- Benefícios: o que melhorou (menos código, performance, UX, etc.)
- Consumo de tokens: estimado a partir do diff

Use `/report` no final da implementação para gerar o relatório.
Salvar em `docs/reports/<data>-<nome>.html`.

## Escopo Estrito

**Nunca modifique nada além do que foi pedido.** Se um arquivo precisar de
ajuste não solicitado (lint, formatação, refactor, renomear, deletar), pergunte
antes. "Já que estou aqui" gera diff imprevisível e quebra revisão.

Exceção: correções óbvias que impedem o código de funcionar (import faltando,
typo em variável, erro de sintaxe).

## Observações Gerais

- Não adicionar dependências sem necessidade
- Manter consistência do design system (cores, sombras, animações)
- Todas as queries e mutations usam React Query com invalidateQueries
- Supabase RLS policies por user_id (auth.uid())
- Tokens armazenados em ~/.config/opencode/tokens.json (gitignored)
