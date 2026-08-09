# 🧩 Convenções de Feature — MilesControl

> Slice de [`docs/CONVENTIONS.md`](../CONVENTIONS.md) — índice com todos os slices.
> Carregado na categoria **feature** (junto de `conventions/common.md`).

> Carregado na categoria **feature** (junto de WORKFLOW.md e conventions/common.md).

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

## Hierarquia de Providers — OBRIGATÓRIO

**Toda componente que usa um Context DEVE estar dentro do Provider correspondente.**

Antes de adicionar `useData()`, `useAuth()`, ou qualquer hook de contexto em um componente, verifique a árvore de providers no `App.tsx`.

```tsx
// ❌ ERRADO: BottomTabBar usa useData() mas está FORA de DataProvider
<DataProvider>
  <main>{children}</main>
</DataProvider>
<BottomTabBar />  // ❌ crash: useData() sem DataProvider

// ✅ CORRETO: BottomTabBar está DENTRO de DataProvider
<DataProvider>
  <main>{children}</main>
  <BottomTabBar />  // ✅ funciona
</DataProvider>
```

**Regra:** Se um componente precisa de dados do contexto, ele DEVE estar na sub-árvore do Provider.

**Checklist antes de PR:**
- [ ] Todo componente que usa `useData()` está dentro de `DataProvider`?
- [ ] Todo componente que usa `useAuth()` está dentro de `AuthProvider`?
- [ ] A hierarquia de providers está correta no `App.tsx`?

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
// ❌ ERRADO: UI promete preservar "Transferência" mas código deleta tudo
<p>O tipo "Transferência" continua disponível.</p>
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

## Testes com Uso Real — REGRA #24

Sempre que possível, os testes E2E devem executar o fluxo real contra o Supabase de produção, não apenas mocks isolados.

### Por quê?
- Mocks escondem race conditions, comportamento de terceiros (Radix UI, Supabase) e timing de rede
- Playwright + Supabase real expõe bugs que testes unitários nunca pegam
- A única forma de garantir que "funciona" é testar o que o usuário realmente faz

### Checklist

| Situação | Abordagem real | Abordagem falsa (evitar) |
|----------|---------------|--------------------------|
| Criação inline | Criar usuário real no Supabase, navegar, preencher formulário | Mockar resposta da mutation |
| Select dropdown | Verificar se texto aparece no DOM renderizado com Radix | Mockar componente Select |
| Navegação entre páginas | Usar `page.goto()` e esperar load | Simular eventos sem navegação |
| Cache React Query | Verificar se dado aparece sem recarregar | Mockar queryClient |

### Ferramentas
- **Playwright** com `baseURL` apontando para dev server real (`http://localhost:8080`)
- **Supabase** de produção/staging com credenciais anônimas
- **Usuários efêmeros** — criar com `email: test_\${Date.now()}@teste.com`, dados são limpos periodicamente

### Armadilhas comuns (já encontradas)
1. **Radix Select com portal:** `getByRole('dialog').nth(N)` é frágil — usar `{ name: 'Título' }` quando possível
2. **CSS :has() em locator:** `button:has(svg.lucide-plus)` pode não funcionar em todos contextos — preferir `button svg.lucide-plus` + navegar ao pai
3. **Tabs com defaultTab:** verificar aba correta antes de procurar elementos
4. **Placeholder vs valor real:** Se Select tem `value` definido, o placeholder não aparece — o texto do item selecionado aparece

## Estoques e Cache (Regras #19 e #20)

### Consistência de Estoque

**Toda chamada `invalidateQueries` DEVE usar `refetchType: 'all'`.**

TanStack Query v5 usa `refetchType: 'active'` como padrão, que só refetcha
queries com observers ativos. Combinado com `staleTime: 30s` e
`refetchOnWindowFocus: false`, isso impede que o estoque reflita em tempo
real. `refetchType: 'all'` força refetch independentemente do estado da query.

```ts
// ✅ Correto
queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });

// ❌ Incorreto (pode não refetch)
queryClient.invalidateQueries({ queryKey: ["accounts"] });
```

### Mutações de Saldo

Toda mutation que altera saldo de conta DEVE:
1. Usar `calcAccountUpdate` de `src/lib/accounts.ts` para calcular novo estado
2. Invalidar a query de `accounts` no `onSuccess`
3. Invalidar a query da entidade relacionada (entries, sales, etc.)

### Tipos de Origem com Atualização Otimista

Ao criar um novo tipo de origem DURANTE o registro de entrada, a mutation
DEVE fazer `setQueryData` otimista para que o dropdown apareça
i**instantaneamente**, sem esperar o refetch:

```ts
// ✅ Correto — adiciona ao cache + invalida
queryClient.setQueryData<OrigemType[]>(["origem_types", userId], (old) => {
  if (!old) return [variables];
  if (old.some((o) => o.id === variables.id)) return old;
  return [...old, variables];
});
queryClient.invalidateQueries({ queryKey: ["origem_types"], refetchType: 'all' });
```

### Validação Automática

A regra #19 (estoque) é validada estaticamente no `pre-pr` via
`scripts/rules/rule-19-stock-validation.mjs`, que verifica:
- Todas as chamadas `invalidateQueries` têm `refetchType: 'all'`
- Mutações de saldo invalidam `accounts`
- `calcAccountUpdate` é usado corretamente

### Script de Validação Runtime

`npm run validate-stock <user_id>` conecta direto no Supabase e compara:
- Saldo esperado (entradas - vendas - transferências)
- Saldo real (accounts.balance)
- Reporta discrepâncias
- Aceita `--fix` para corrigir automaticamente
