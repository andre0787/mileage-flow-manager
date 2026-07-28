# Spec Técnica: Classificação Inteligente, Consulta NL e Design System

> Fase 3-4 do plano de recomendações Claude Cookbook.
> Branch: `feat/prompt-versioning-phase1`

## 1. Auto-Classification (`src/lib/auto-classify.ts`)

### Propósito
Classificar automaticamente entradas de milhas/pontos em categorias semânticas (compra, transferência, bônus, viagem) baseado no nome/descrição do tipo de origem.

### API

```typescript
classifyByText(text: string): { category: Category; confidence: number }
detectProgram(text: string): string | undefined
classifyEntry(entry: { name: string; description?: string; amount: number; }): ClassifiedEntry
categoryLabel(category: Category): string    // pt-BR labels
categoryColor(category: Category): string    // hex colors
```

### Categorias
| Categoria | Keywords | Cor |
|-----------|----------|-----|
| compra | compra, adquirir, assinatura, clube | `#ef4444` (red) |
| transferencia | transferência, envio, movimentação | `#3b82f6` (blue) |
| bonus | bônus, promoção, bônus promo, bônus assinatura | `#22c55e` (green) |
| viagem | passagem, reserva, hotel, aluguel | `#f59e0b` (amber) |

### Regras de Negócio
- Volume alto (>50000) sem classificação → sugere transferência
- Case-insensitive + stripping de acentos via `normalize()`
- `detectProgram` usa lista de programas conhecidos (Azul, LATAM, Smiles, Livelo, etc.)

## 2. Text-to-Query (`src/lib/text-to-query.ts`)

### Propósito
Converter linguagem natural em filtros estruturados para consultas no Supabase/relatórios.

### Padrões Suportados (21 regex patterns)
| Query de Exemplo | Tabela | Período | Métrica |
|-----------------|--------|---------|---------|
| vendas do mês passado | sales | last_month | profit |
| entradas por programa | entries | — | amount |
| clientes ativos | clients | — | count |
| lucro total | sales | all | profit |
| saldo por programa | accounts | — | balance |

### API
```typescript
parseNaturalQuery(query: string): QueryFilter | null
describeFilters(filters: QueryFilter): string
filtersToSupabaseParams(filters: QueryFilter): SupabaseParams
```

### Integração
- **useSmartQuery hook** (`src/hooks/useSmartQuery.ts`): encapsula estado + parsing + sugestões
- **Relatorios.tsx**: card "Consulta Inteligente" com sugestões clicáveis + auto-filtro

## 3. Design System — Novos Componentes

### StatusBadge
Badge de status consistente com cores do design system.
- Mapeamento: confirmada→success, aguardando→warning, pendente→warning, pago→outline, concluido→success, cancelado→destructive
- Props: `status`, `size` (sm/default/lg), `showLabel`

### SearchInput
Input de busca com ícone, hotkey ⌘K, botão limpar.
- Feedback visual: `transition-card`, `shadow-elegant` no foco
- Hotkey global Ctrl+K/⌘K (useEffect)
- `showHotkey` toggle

### DataTable
Tabela responsiva com busca, paginação, mobile cards.
- Props genéricas `<T>`: columns, search, pagination, loading, empty state
- Mobile: cards em grid, Desktop: table HTML
- Reutiliza SearchInput + Pagination + EmptyState

## 4. Hook useSmartQuery

```typescript
const { nlQuery, setNlQuery, nlFilters, description, clearQuery, suggestions, isValid } = useSmartQuery();
```

- 7 sugestões pré-definidas (vendas do mês passado, entradas por programa, etc.)
- Auto-aplicação de período (this_month→30, last_month→60, etc.)
- `periodFromFilter()` utility para mapeamento de períodos

## 5. Validações

| Rule | Descrição | Arquivo |
|------|-----------|---------|
| rule-29 | Prompt versioning: todo prompt/skill tem hash no manifesto | `rule-29-prompt-version.mjs` |
| rule-30 | Outcome grade ≥80%: quality gates no diff | `rule-30-outcome-grade.mjs` |
| rule-31 | Cobertura de testes libs: toda lib em src/lib/ tem test | `rule-31-lib-test-coverage.mjs` |

## 6. Métricas de Teste

| Suite | Testes | Status |
|-------|--------|--------|
| auto-classify | 16 | ✅ |
| text-to-query | 14 | ✅ |
| useSmartQuery | 20 | ✅ |
| StatusBadge | 9 | ✅ |
| SearchInput | 9 | ✅ |
| **Total** | **68 novos testes** | **✅** |
