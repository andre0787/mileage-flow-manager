# ⚙️ Convenções de Workflow — MilesControl

> Slice de [`docs/CONVENTIONS.md`](../CONVENTIONS.md) — índice com todos os slices.
> Carregado no workflow de **todas** as categorias (regras de processo).

> Carregado junto de WORKFLOW.md e do slice da categoria.

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

## Regras de Workflow — Detalhamento

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
