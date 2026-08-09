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

## Navegação de Código — Símbolos Primeiro

Antes de ler qualquer arquivo-fonte inteiro, tente navegação simbólica/estrutural.
O MCP do Serena não está configurado no pi (apenas VS Code); use as ferramentas
realmente disponíveis no ambiente de execução:

1. **`code-review-graph`** (CLI v2.3.7, skill `.pi/skills/code-review-graph`) —
   grafo persistente de símbolos/arestas; queries de arquitetura, código morto e impacto
2. **`grep -rn "<símbolo>" src/`** — localizar definição/uso sem abrir o arquivo inteiro
3. **`read` com `offset`/`limit`** — ler só o trecho necessário
4. **`read` completo** — só quando a navegação parcial não for suficiente

> **Regra de ouro:** se você sabe o nome do símbolo que precisa tocar, não leia o arquivo
> inteiro. Navegação estrutural custa 5-10× menos tokens e entrega exatamente
> o que você precisa. Se o Serena estiver disponível (VS Code), vale o mesmo princípio
> com `serena_get_symbols_overview` / `serena_find_symbol`.

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

**Todo bug encontrado durante desenvolvimento DEVE virar GitHub Issue** com label `bug`, mesmo que corrigido na hora.

### Como registrar:
- Use `gh issue create --title "descrição" --label bug`.
- No PR, referencie o número da issue quando a correção fizer parte da mesma entrega.

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
| #22 — PR naming convention | `rule-22-pr-naming.mjs` (auto no pre-pr) | `scripts/rules/rule-22-pr-naming.mjs` |
| #36 — Evidência de processo válida | `npm run process:audit -- --check` (auto no pre-pr via rule-36) | `scripts/rules/rule-36-process-evidence.mjs` |
| #37 — Integração RTK ativa | `npm run rule:37` (auto no pre-pr) | `scripts/rules/rule-37-rtk.mjs` (veredito: `docs/council/2026-08-08-rtk-integration-veredito.md`) |
| Deploy health | `check-deploy.mjs` | `scripts/check-deploy.mjs` |
| Retrospectiva | `retro.mjs` | `scripts/retro.mjs` |
| CI Process | `CI-PROCESS.md` | `docs/CI-PROCESS.md` |

### Como criar uma nova validação

1. Identifique o ponto de violação (commitar, pushar, PR, deploy)
2. Escolha o mecanismo mais simples:
   - **Git hook** (`pre-commit`, `pre-push`) para ações locais
   - **Script npm** para verificações sob demanda
   - **CI check** para validação em PR
3. Registre na tabela acima
4. Se for hook, garanta que ele é instalado via `session:start`

**Sem validação automática, a regra não está completa.**

### Auditoria de evidência de processo (read-only)

O comando `npm run process:audit` valida `docs/tracking/events.jsonl` sem gravar
nada:

- `npm run process:audit` — relatório humano (contagens por tipo, inválidos, unobserved)
- `npm run process:audit -- --check` — exit 1 se houver evento inválido (mesma lógica da rule-36 no pre-pr)
- `npm run process:audit -- --json` — objeto estruturado para CI

Regras do auditor:

1. Campos sensíveis (`prompt`, `output`, `token`, `apiKey`, `password`…) tornam o
   evento inválido **sem ecoar o valor** no relatório.
2. Resoluções do router sem conclusão são reportadas como `unobserved`, que é
   **distinto** de evento inválido: não falha o `--check` até o contrato de
   conclusão do router estar ativo.
3. O comando é read-only: nunca reescreve nem apaga linhas do log.

### Auditoria estrutural do projeto (read-only)

O comando `npm run project:audit` inspeciona estrutura, duplicidade e artefatos
gerados sem mutar nada:

- `npm run project:audit` — relatório humano (checks por regra + findings classificados)
- `npm run project:audit -- --json` — documento JSON (`checks`, `findings`) para CI, sem ANSI
- `npm run project:audit -- --strict` — exit 1 se houver finding crítico ou check falho

Domínios e limites (não duplica algoritmos das regras):

1. Roda as regras 14, 15, 16, 18, 23, 31 e 32 como child processes; falha de regra
   vira check `fail`, nunca é convertida em pass.
2. `classifyTrackedArtifacts` (scripts/lib/project-audit.mjs) marca `generated`
   critical apenas diretórios gerados (`playwright-report/`, `test-results/`,
   `dist/`, `coverage/`) fora da allowlist operacional (`docs/tracking/`,
   `supabase/migrations/`, `.pi/skills/`, `scripts/lib/`, `scripts/rules/`,
   `docs/superpowers/`, `docs/council/`); `docs/archive/`, `docs/reports/` e
   `docs/audits/` são históricos preservados.
3. Detecção de órfãos respeita entry points, fixtures, migrações e docs
   históricos; duplicatas usam o threshold da rule-15; `npm audit` (segurança)
   é separado da auditoria estrutural.
4. Não existe flag genérica `--fix`: remoções são commits explícitos e
   allowlisted. A saída JSON só contém caminhos/categorias/contagens, nunca
   conteúdo de arquivo.

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

## CI/CD & Verificação

### Pipeline (`.github/workflows/ci.yml`)

Sequência obrigatória em todo PR:
1. **Full check** — `npm run check` (typecheck, lint, format:check, unit, verify-docs:strict, build)
2. **Playwright install** — `npx playwright install --with-deps`
3. **E2E tests** — `npm run test:e2e`
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

## Arquivos Duplicados Raiz/Docs — REGRA #18

**Um arquivo `.md` NÃO pode existir simultaneamente na raiz do projeto e em `docs/`.**

```bash
# Verificação manual
node scripts/rules/rule-18-no-duplicate-root-docs.mjs
```

### Por quê?
- Merges conflitantes podem recriar um arquivo na raiz enquanto a versão em `docs/` permanece
- Exemplo real: `HANDOFF.md` na raiz e `docs/handoff.md` com conteúdos diferentes após merge
- Ferramentas do projeto lêem de `docs/handoff.md` mas AGENTS.md referia `HANDOFF.md` → inconsistência

### Como a validação funciona
1. Lista todos os `.md` na raiz (exceto ocultos)
2. Compara com `.md` em `docs/` por nome (case-insensitive)
3. Se encontrar correspondência, falha com lista de duplicatas

### Exceções
- Nenhuma. Se o arquivo precisa estar em `docs/`, não deve estar na raiz.

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

## Testes Contra Produção — REGRA #25

**Toda feature que envolve criação/alteração de dados DEVE ser testada contra produção.**

### Quando testar contra produção (obrigatório)

1. **Feature que cria/altera dados** (criação inline de dono, programa, conta)
   - Risco: cache do SW pode esconder o novo registro do `invalidateQueries`
2. **Bug reportado em produção** — reprodução fiel
3. **Mudanças no PWA/SW config** (`vite.config.ts`, `workbox`, `runtimeCaching`)

### Como testar

```bash
# Local (rápido) — sempre passa primeiro
npx playwright test

# Contra produção (confiável) — após local passar
npm run test:e2e:prod

# Apenas smoke tests contra produção (CI)
npm run test:e2e:prod:smoke
```

### Config

O `playwright.config.ts` já lê `process.env.BASE_URL` com fallback para
`http://localhost:8080`. Quando `BASE_URL` está definido, o webServer local
NÃO é iniciado.

```typescript
const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const IS_PRODUCTION_TEST = !!process.env.BASE_URL;
```

### Armadilhas conhecidas (ver `docs/TESTING-PRODUCTION.md`)

1. **SW `StaleWhileRevalidate`** — cache de 5 min esconde dados (já corrigido no PR #212)
2. **Playwright não ativa SW rápido o suficiente** — primeiro fetch pode não passar pelo SW
3. **Vercel cold start** — primeiro request até 5s
4. **Rate limiting Supabase** — 100 req/min para anônimo

### Verificação automática

A regra #25 é validada no pre-pr via `scripts/rules/rule-25-production-tests.mjs`,
que verifica:
- Feature que altera dados tem teste E2E
- Teste E2E pode rodar contra produção (usa `BASE_URL`)

### Por quê?

Bug #212 (dono não carregar no dropdown) só foi descoberto em produção. E2E contra
localhost passava porque o SW não estava ativo. Testar contra produção é a única
forma de garantir o comportamento real que o usuário vai experimentar.

### #02 — Lazy Loading por Categoria

O AGENTS.md define categorias de tarefa (feature, bugfix, docs, refactor, chore).
O agente DEVE carregar APENAS os docs permitidos para a categoria escolhida.

**Violação:** carregar doc não permitido para a categoria.
**Valida:** `rule-02-category-loading.mjs`

### #03 — Handoff Completeness

O handoff.md DEVE ter todos os campos obrigatórios:
- Projeto, Estado Atual, Branch, Bugs Abertos
- Sessão Atual, Categoria, Docs carregados, Última Sessão

**Violação:** seção ausente.
**Valida:** `rule-03-handoff-completeness.mjs`

### #20 — AGENDA.md Arquivado

AGENDA.md foi arquivado em `docs/archive/AGENDA-2026.md`.
Nenhum script deve referenciá-lo.

**Violação:** script referencia AGENDA.md.
**Valida:** `rule-20-no-agenda-load.mjs`

### #26 — session:start Obrigatório

O `npm run session:start` DEVE ser executado no início de toda sessão.
O script escreve um marcador com timestamp em `docs/handoff.md`.

**Violação:** handoff.md sem seção Sessão Atual, sem timestamp, ou branch divergente.
**Valida:** `rule-26-session-started.mjs`

### #27 — Council Obrigatório (Feature)

No workflow **feature**, o LLM Council DEVE ser executado e seu veredito
salvo em `docs/council/` antes da implementação.

**Violação:** categoria feature sem veredito do council em `docs/council/`.
**Valida:** `rule-27-council-veredict.mjs`

### #28 — Spec Obrigatória (Refactor)

No workflow **refactor** (e opcionalmente feature), a spec técnica DEVE
ser criada em `docs/superpowers/specs/` antes da implementação.

**Violação:** categoria refactor sem spec em `docs/superpowers/specs/`.
**Valida:** `rule-28-spec-exists.mjs`

## Observações Gerais

- Não adicionar dependências sem necessidade
- Manter consistência do design system (cores, sombras, animações)
- Todas as queries e mutations usam React Query com invalidateQueries
- Supabase RLS policies por user_id (auth.uid())
- Tokens armazenados em ~/.config/opencode/tokens.json (gitignored)
