# 📏 Convenções de Código — MilesControl

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

## DRY & Modularidade

- **Nunca construir em monolito.** Componente que acumula layout + estado + fetch + formatação é flag de refatoração. Extrair em submódulos (`ui/`, `hooks/`, `lib/`).
- **Sempre reutilizável, nunca duplicado.** Se um pattern serve 2+ lugares, extrair. Se só existe em 1 lugar, esperar o 2º uso (YAGNI).
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
import { useAddOwnerMutation } from "@/hooks/useDatabase"
import { useData } from "@/contexts/DataContext"
import { formatCPF } from "@/lib/utils"

// ❌ Evitar
import { MetricCard } from "../../components/MetricCard"
import { useDatabase } from "@/hooks/useDatabase" // barrel ok, mas prefira o hook específico
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
1. Obtém o diff: `git diff $(git merge-base HEAD origin/main)..HEAD`
2. Extrai antes/depois, benefícios e estimativa de tokens
3. Gera HTML em `docs/reports/<data>-<nome>.html`
4. Versiona o relatório junto com o código

### O que o relatório deve conter:
- **Antes/Depois**: o que existia vs o que foi implementado (máx 3 linhas cada)
- **Benefícios**: tópicos do que melhorou (menos código, performance, UX, etc.)
- **Consumo de tokens**: estimado a partir do diff (~¾ token por linha)
- **Badges**: tipo da branch, PR, ambiente, data

### Nomenclatura — OBRIGATÓRIO

O relatório DEVE seguir o padrão: `<prefixo>-YYYY-MM-DD-<nome>.html`

**Prefixos válidos:** `PR<num>`, `Sprint<letra>`, `auto`, `fix`, `feat`, `docs`, `chore`
- `PR<num>` — relatório vinculado a um PR específico (preferencial)
- `Sprint<letra>` — relatório de sprint completo
- `fix/feat/docs/chore` — relatórios avulsos sem PR dedicado
- `auto` — relatórios gerados por workflow automático

### Exemplos reais:
```
docs/reports/2026-07-09/PR58-2026-07-09-bugfix-testes.html
docs/reports/2026-07-09/PR55-2026-07-09-sprint4-csv-export.html
docs/reports/2026-07-11/SprintC-2026-07-11-polimento-prevencao.html
docs/reports/2026-07-10/fix-2026-07-10-overflow-selectors.html
docs/reports/2026-07-10/docs-2026-07-10-mapa-completo-fluxos-usuario.html
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
- Relatórios (`docs/reports/<data>/`)
- Council verdicts (`docs/council/`)
- Plans & specs (`docs/superpowers/`)

**Checklist de saída:**
1. `git status` — verificar arquivos pendentes
2. `git add .` — stage tudo que foi criado/modificado
3. `git commit` — commitar com mensagem descritiva
4. `git push` — subir para o repositório
5. Atualizar `HANDOFF.md` com estado atual

**Exceção:** apenas arquivos em `.gitignore` (node_modules, .env, test-results/).

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

## CI/CD & Verificação

### Pipeline (`.github/workflows/ci.yml`)

Sequência obrigatória em todo PR:
1. **Build** — `npm run build` (Vite)
2. **Unit tests** — `npm test` (Vitest, 45 testes)
3. **E2E tests** — `npm run test:e2e` (Playwright, 54 testes)
4. **Upload report** — `playwright-report/` como artifact

### Deploy (`.github/workflows/deploy.yml`)

- Gatilho: merge na `main`
- Deploy automático via Vercel

### Verificação de Docs

Antes de todo PR que altera docs:
```bash
node scripts/verify-docs.mjs
```
O script verifica:
- Links internos quebrados
- Arquivos órfãos (sem referência)
- Promessas de UI inconsistentes

Use `--strict` para exit code 1 se houver issues.

### Cross-Harness

O projeto é compatível com 3 harnesses:
- **pi** (harness principal) — skills em `.pi/skills/`
- **Claude Code** — config em `.claude/settings.local.json`
- **OpenCode** — config em `.opencode/settings.json`

Todas as skills seguem o Agent Skills standard.

## Debug

Ver `docs/DEBUG.md` para guia completo.

### Convenções

- **Logger:** usar `logInfo()`/`logWarn()`/`logError()`/`logDestructiveOp()` de `@/lib/logger`
- **Ativação:** `VITE_ENABLE_DEBUG_LOG=true` no `.env.local`
- **Persistência:** logs ficam no localStorage (`mc_debug_logs`), últimos 100
- **Breakpoints:** `.vscode/launch.json` configurado — F5 com Vite rodando
- **Testes:** F5 com arquivo de teste aberto
- **Console.log:** só em dev, remover antes do PR (CRLF)

## Observações Gerais

- Não adicionar dependências sem necessidade
- Manter consistência do design system (cores, sombras, animações)
- Todas as queries e mutations usam React Query com invalidateQueries
- Supabase RLS policies por user_id (auth.uid())
- Tokens armazenados em ~/.config/opencode/tokens.json (gitignored)
