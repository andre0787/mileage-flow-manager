# 📏 Convenções Comuns — MilesControl

> Slice de [`docs/CONVENTIONS.md`](../CONVENTIONS.md) — índice com todos os slices.
> Carregado em **toda** categoria de código (feature, bugfix, refactor).

> Sempre carregado (todas as categorias).

## Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | `PascalCase.tsx` | `MetricCard.tsx` |
| Utilitários | `camelCase.ts` | `formatCPF.ts` |
| Hooks | `camelCase.ts` | `useDebounce.ts` |
| Tipos | `index.ts` | `types/index.ts` |
| Import path | `@/` → `src/` | `@/components/MetricCard` |
| PR / Workflow | `Sprint <letra> — <descrição>` | `Sprint C — Polimento & Prevenção` |

**Interface:** português (pt-BR)
**PR naming:** `<Sprint|fix|feat|chore|docs> <scope> — <descrição>` em português (ver `WORKFLOW.md`)

## Organização de Código

- **Business logic** → `src/lib/*.ts` (funções puras, sem React/Supabase)
- **Queries/mutations** → `src/hooks/useDatabase/` (split por entidade)
- **Componentes de UI** → `src/components/`
- **Páginas** → `src/pages/`
- **Ponto único de alteração**: cada regra de negócio em 1 arquivo apenas

## Navegação de Código — Gate de Análise

Antes de ler qualquer arquivo-fonte inteiro, use o **gate de navegação** para decidir a ferramenta:

```bash
npm run nav:gate            # decide e mostra comandos recomendados
npm run nav:gate -- --json  # saída JSON parseável
```

Decisão do gate (primeiro match vence):
1. **`code-review-graph`** (CLI v2.3.7 via pipx, skill `.pi/skills/code-review-graph`) — padrão no pi: grafo persistente de símbolos/arestas, queries de arquitetura, código morto e impacto
2. **Serena** (somente quando `SERENA_MCP_URL` estiver definido, ex. VS Code) — `serena_get_symbols_overview` / `serena_find_symbol`
3. **`grep -rn` + `read` com offset/limit** — fallback universal

> **Regra de ouro:** se você sabe o nome do símbolo que precisa tocar, não leia o arquivo
> inteiro. Navegação estrutural custa 5-10× menos tokens e entrega exatamente
> o que você precisa.

## Importações

```tsx
// ✅ Correto
import { MetricCard } from "@/components/MetricCard"
import { useAddOwnerMutation } from "@/hooks/useDatabase"
import { useData } from "@/contexts/DataContext"
import { formatCPF } from "@/lib/utils"

// ❌ Evitar
import { MetricCard } from "../../components/MetricCard"
import { useDatabase } from "@/hooks/useDatabase" // barrel ok, mas prefira o hook específico
```

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
