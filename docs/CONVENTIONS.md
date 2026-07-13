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

## Handoff — Atualização Obrigatória Pós-PR

**Sempre que subir um PR (criar ou mergear), atualize o `docs/handoff.md`** com:
- Progresso atualizado (Done / In Progress / Pending)
- PRs criados/mergeados
- Branch atual
- Próximos passos

Isso garante continuidade entre sessões sem perda de contexto.

## Relatório Pós-Implementação — OBRIGATÓRIO (NUNCA PULAR)

**🔥 REGRA ABSOLUTA: NUNCA pular o relatório HTML, independente do tamanho da mudança.**

1 linha, 1 arquivo, 1 caractere — sempre gera o relatório. O `pre-pr-check.mjs` falha se não encontrar relatório.

**Toda tarefa (feature, fix, docs, chore, refactor — QUALQUER alteração de código ou docs) DEVE gerar um relatório HTML antes do PR.**

### Automático (recomendado — executa como parte do workflow)

```bash
npm run pre-pr
```

Gera automaticamente se não existir:
```bash
npm run report "Descrição da tarefa" --write
```

Ou manualmente com evidências:
```bash
npm run report "Feature X" --evidence "https://...imagem.png" --before "..." --after "..." --write
```

### Manual (fallback)

Use `/report` (template em `.pi/prompts/report.md`) quando precisar de texto narrativo:
1. Obtém o diff: `git diff $(git merge-base HEAD origin/main)..HEAD`
2. Extrai antes/depois, benefícios e estimativa de tokens
3. Gera HTML em `docs/reports/<data>/<prefixo>-<data>-<nome>.html`
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

## 💭 Caixa de Entrada de Ideias

**`docs/IDEIAS.md`** é a caixa de entrada para ideias humanas.
O agente lê este arquivo no início de toda sessão e pergunta ao usuário
se quer consumir alguma ideia pendente.

**Como adicionar:** `npm run think "descrição"`
**Como consumir:** mover de `Pendentes` → `Em Andamento` → `Consumidas`

## 🐞 Registro de Bugs

**Todo bug encontrado durante desenvolvimento DEVE ser registrado na AGENDA.md**
na seção `🐞 Bugs Encontrados`, mesmo que corrigido na hora.

### Como registrar:
- **Bug do GitHub Issues:** usar o número da issue como identificador
- **Bug descoberto durante dev:** descrever brevemente + severidade (`alta`/`média`/`baixa`)
- Adicionar na tabela de corrigidos se já foi resolvido, ou em abertos se ficou pendente

### Modos de registro:

1. **Manual:** usuário diz "registra bug: ..." e o agente adiciona na tabela
2. **Automático:** o agente registra bugs automaticamente quando:
   - Encontra um bug durante code review ou análise de PR
   - Identifica um bug durante desenvolvimento de feature
   - Testes falham revelando bug legítimo (não flaky)
   - Um bug é corrigido no mesmo PR — registra como corrigido

> O agente sempre pergunta antes de registrar algo que não seja claramente um bug.
> Dúvida = não registra.

### Por quê?
- Cria rastro histórico do que já quebrou
- Ajuda a validar backlog (se um bug aparece várias vezes, merece atenção)
- Evita regressão do mesmo bug em PR futuro

## Escopo Estrito

**Nunca modifique nada além do que foi pedido.** Se um arquivo precisar de
ajuste não solicitado (lint, formatação, refactor, renomear, deletar), pergunte
antes. "Já que estou aqui" gera diff imprevisível e quebra revisão.

Exceção: correções óbvias que impedem o código de funcionar (import faltando,
typo em variável, erro de sintaxe).

## 🔬 Validação Automática de Regras — OBRIGATÓRIA

**Toda regra imutável em `AGENTS.md` DEVE ter um script de validação**
que impeça sua violação de forma automatizada.

### Exemplos no projeto

| Regra | Validação | Localização |
|-------|-----------|-------------|
| #4 — NUNCA commitar na main | Pre-commit hook | `.githooks/pre-commit` |
| #10 — Zero arquivos uncommitted | `npm run pre-pr` + `session:end` | `scripts/pre-pr-check.mjs` |
| #14 — Sem arquivos órfãos em `src/` | `rule-14-orphan-files.mjs` | `scripts/rules/rule-14-orphan-files.mjs` |
| #15 — Sem duplicatas > 75% em componentes | `rule-15-duplicate-code.mjs` | `scripts/rules/rule-15-duplicate-code.mjs` |
| #16 — Scripts têm atalho npm | `rule-16-orphan-scripts.mjs` | `scripts/rules/rule-16-orphan-scripts.mjs` |
| verify-docs — Docs refs código inexistentes | `verify-docs.mjs` (check #4) | `scripts/verify-docs.mjs` |
| #17 — Novos .md válidos (órfãos, links, MAP.md) | `rule-17-new-docs-valid.mjs` (auto no pre-pr) | `scripts/rules/rule-17-new-docs-valid.mjs` |

### Como criar uma nova validação

1. Identifique o ponto de violação (commitar, pushar, PR, deploy)
2. Escolha o mecanismo mais simples:
   - **Git hook** (`pre-commit`, `pre-push`) para ações locais
   - **Script npm** para verificações sob demanda
   - **CI check** para validação em PR
3. Registre na tabela acima
4. Se for hook, garanta que ele é instalado via `session:start`

**Sem validação automática, a regra não está completa.**

## Limpeza Pós-Sessão — OBRIGATÓRIA

**Antes de finalizar qualquer sessão ou subir PR, verifique `git status`.**

Regra: **zero arquivos uncommitted** ao sair. Isso inclui:
- Código fonte (`src/`)
- Documentação (`docs/`, `*.md` raiz)
- Dependências (`package.json`, `package-lock.json`)
- Relatórios (`docs/reports/<data>/`)
- Council verdicts (`docs/council/`)
- Plans & specs (`docs/superpowers/`)

### Automático (recomendado)

```bash
npm run session:end "tipo: descrição"
```

Faz tudo em 1 comando: add → commit → update-handoff → push.

### Manual (fallback)

**Checklist de saída:**
1. `git status` — verificar arquivos pendentes
2. `git add .` — stage tudo que foi criado/modificado
3. `git commit` — commitar com mensagem descritiva
4. `npm run handoff` — atualiza docs/handoff.md
5. `git add docs/handoff.md && git commit -m "docs: update handoff"`
6. `git push` — subir para o repositório

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
1. Links internos quebrados
2. Arquivos órfãos (sem referência)
3. Promessas de UI inconsistentes
4. **Referências a arquivos de código que não existem** (`.ts`/`.tsx`/`.mjs`)

Use `--strict` para exit code 1 se houver issues.

```bash
# Atalhos npm
npm run verify-docs        # scan completo
npm run verify-docs:strict # exit 1 se achar issues
```

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

## Arquivos Órfãos — REGRA #14

**Nenhum arquivo `.ts`/`.tsx` em `src/` pode ficar sem ser importado por ninguém.**

```bash
# Verificação manual
node scripts/rules/rule-14-orphan-files.mjs
```

### Exceções
- `src/main.tsx` — entry point do Vite
- `src/vite-env.d.ts` — tipagens do Vite
- Arquivos `.d.ts` — type declarations

### Por quê?
- Arquivos não importados são código morto disfarçado
- Testes em `src/` (fora de `tests/`) não são executados pelo vitest
- A regra #14 flagou `RecurrenceControls.tsx` como órfão durante a auditoria

## Código Duplicado — REGRA #15

**Componentes em `src/components/` (exceto `ui/`) não podem ter similaridade Dice > 75%.**

```bash
# Verificação manual
node scripts/rules/rule-15-duplicate-code.mjs
```

### Como funciona
- Compara linhas (trimmed, não vazias) de cada par de `.tsx`
- Usa coeficiente Dice: `2 × |intersecção| / (|A| + |B|)`
- Ignora arquivos < 20 linhas e pares com tamanho muito discrepante (< 0.5× ou > 2×)

### Por quê?
- A auditoria encontrou `EntryFormMilhas.tsx` (433 linhas) ≈ `EntryFormPontos.tsx` (452 linhas) com ~90% de similaridade
- Código duplicado dobra custo de manutenção (bug fix em 2 lugares)

## Scripts Órfãos — REGRA #16

**Todo script em `scripts/` DEVE ter um atalho npm correspondente em `package.json`.**

```bash
# Verificação manual
node scripts/rules/rule-16-orphan-scripts.mjs
```

### Exceções
- `scripts/lib.mjs` — módulo utilitário compartilhado, não é script executável

### Por quê?
- Scripts sem atalho npm são invisíveis para devs (`npm run <tab>` não mostra)
- A auditoria encontrou `quality-report.mjs` sem atalho

## Novos .md Válidos — REGRA #17

**Todo novo arquivo `.md` adicionado ao projeto DEVE ser validado automaticamente.**

```bash
# A validação roda automaticamente no pre-pr
node scripts/rules/rule-17-new-docs-valid.mjs
```

### O que o script verifica:
1. **MAP.md:** se o arquivo está em `docs/` (exceto archive/ e reports/), precisa estar listado em `docs/MAP.md`
2. **Órfão:** precisa ser referenciado por pelo menos 1 outro `.md` no projeto
3. **Links:** links internos dentro do arquivo precisam apontar para arquivos que existem

### Ignorados
- `node_modules/`, `docs/reports/`, `docs/archive/`, `.opencode/`, `.pi/`

### Por quê?
- Impede que novos arquivos MD caiam nos mesmos problemas que encontramos (órfãos sem referência, links quebrados, docs invisíveis)
- A validação é automática no pre-pr, sem esforço manual

## Observações Gerais

- Não adicionar dependências sem necessidade
- Manter consistência do design system (cores, sombras, animações)
- Todas as queries e mutations usam React Query com invalidateQueries
- Supabase RLS policies por user_id (auth.uid())
- Tokens armazenados em ~/.config/opencode/tokens.json (gitignored)
