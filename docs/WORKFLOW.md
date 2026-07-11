# 🤖 Workflow Obrigatório — council-to-superpowers

**Toda feature ou modificação neste projeto DEVE passar por este workflow.**

## Skills Envolvidas

| Skill | Localização | Função |
|-------|-------------|--------|
| `council-to-superpowers` | `.opencode/skills/`, `.pi/skills/` | Workflow combinado (única skill visível) |
| `llm-council` | `~/.config/opencode/skills/` | Conselho de 5 advisors (usado internamente pelo council) |
| `ponytail` | `~/.config/opencode/skills/`, pacote pi | Modo lazy (stdlib/nativo primeiro) |
| `caveman` | `~/.config/opencode/skills/` | Modo compacto de tokens |

## Fluxo Completo

### Fase 1 — LLM Council (Decisão)

5 advisors analisam a solicitação de ângulos diferentes:

1. **The Contrarian** — busca o que vai falhar
2. **First Principles Thinker** — questiona premissas
3. **The Expansionist** — enxerga oportunidades
4. **The Outsider** — olho fresco, sem viés de domínio
5. **The Executor** — foca no "como fazer"

Cada advisor produz análise independente → peer review anônimo → chairman sintetiza.

**Possíveis vereditos:**
- "Faça" → prossegue para Fase 2
- "Não faça" → apresenta justificativa e encerra
- "Reformule" → sugere ajustes antes de prosseguir

### Fase 2 — Superpowers (Execução)

1. **brainstorming** — explora requisitos, propõe 2-3 abordagens, salva spec em `docs/superpowers/specs/`
2. **writing-plans** — quebra em tarefas de 2-5min, salva em `docs/superpowers/plans/`
3. **branch isolada** — `git checkout -b <prefixo>/<nome>`
4. **implementação** — TDD quando aplicável (RED → GREEN → REFACTOR)
5. **code review** — entre tarefas, bloqueia se critical
6. **PR** — testes verdes, commitar TUDO, PR para `main`
7. **relatório** — `/report` gera HTML com antes/depois, benefícios e consumo de tokens em `docs/reports/`
8. **handoff** — Atualizar `HANDOFF.md` com progresso, PRs e próximos passos

## Gatilhos

A skill `council-to-superpowers` dispara automaticamente em:
- "council this", "war room this", "debate this", "pressure-test this"
- "council then build", "decide and execute", "full workflow"
- "should I X or Y", "which option", "validate this"
- **Qualquer menção a adicionar, modificar, criar, refatorar ou construir algo**

## Exceção

Features triviais podem usar Superpowers direto sem council ("let's build X" → brainstorming). O council decide se pula ou não a fase 2.

## Outputs

| Fase | Artefato | Localização |
|------|----------|-------------|
| Council | Veredito | `docs/council/<data>-<topico>-veredito.md` |
| Brainstorm | Spec | `docs/superpowers/specs/` |
| Planning | Plano | `docs/superpowers/plans/` |
| Execução | Código + testes | `src/` + `tests/` |
| Relatório | HTML before/after | `docs/reports/<prefix>-<data>-<nome>.html` |

> **Nomenclatura de reports:** `<prefix>-YYYY-MM-DD-<nome>.html`.
> Prefixos válidos: `PR<num>`, `Sprint<letra>`, `auto`.
> Exemplos: `PR89-2026-07-11-sprint-11.html`, `SprintC-2026-07-11-polimento-prevencao.html`, `auto-2026-07-11-qualidade.html`.

## Nomenclatura de PRs — OBRIGATÓRIO

O título do PR (que vira nome do workflow no GitHub Actions) DEVE seguir o padrão:

```
<Sprint|fix|feat|chore|docs> <scope> — <descrição>
```

### Regras:
- **1º elemento:** identificador do sprint (`Sprint B`, `Sprint C`) ou tipo de mudança (`fix`, `feat`, `chore`, `docs`)
- **2º elemento (opcional):** escopo curto entre parênteses ou após travessão
- **Separador:** ` — ` (espaço + travessão + espaço)
- **Descrição:** português, capitalizada, max 80 chars

### Exemplos:
```
Sprint B + C — Limpeza & Confiabilidade + Polimento & Prevenção
Sprint #11 — Formulários Dedicados
fix: bugs #77 (entrada save) e #78 (race condition tipos origem)
feat: editar vendas (#86)
chore: debug infra — launch.json, DEBUG.md, logInfo/logWarn
```

### Por quê?
- O GitHub Actions usa o título do PR como nome do workflow run
- Nomes padronizados facilitam identificar o que cada run contém
- O squash merge usa o título como mensagem do commit na `main`

### Commits Squash
Ao mergear com squash, usar o mesmo padrão:
- PR único → título do PR como mensagem
- PR com múltiplas features → `<tipo>: <descrição>`

## Checklist Pré-PR — OBRIGATÓRIO

Antes de criar qualquer PR, executar este checklist:

### 1. Integridade Financeira
- [ ] Toda mutation que altera saldo tem inversão espelhada?
- [ ] Reversals usam custo proporcional (não amountPaid) para transferências?
- [ ] `tests/unit/invariants.test.ts` passa?

### 2. Imutabilidade
- [ ] Nenhum `.sort()` muta array de `useMemo`?
- [ ] Nenhum `.push()` / `.splice()` muta array de `useState`?
- [ ] Dados de props/contexto são tratados como imutáveis?

### 2.5. Hierarquia de Providers
- [ ] Todo componente que usa `useData()` está dentro de `DataProvider`?
- [ ] Todo componente que usa `useAuth()` está dentro de `AuthProvider`?
- [ ] Nenhum componente está renderizado FORA do seu Provider?

### 3. Promessas de UI
- [ ] Mensagens de UI são cumpridas pelo código?
- [ ] Loading states são consistentes com operações reais?
- [ ] Erros são tratados e mostrados ao usuário?

### 4. Config & DRY
- [ ] Não há config duplicada (staleTime, etc.)?
- [ ] Funções utilitárias estão em `lib/` (não inline em componentes)?
- [ ] Imports não têm `as any` sem justificativa?

### 5. Código & Debug
- [ ] Nenhum `console.log` esquecido? (`git diff HEAD -- ":(exclude)src/lib/logger.ts" | grep "console\."`)
- [ ] `VITE_ENABLE_DEBUG_LOG` só true em dev (não no `.env` versionado)?
- [ ] GitHub Actions CI verde no PR?
- [ ] `npm run build` passa?
- [ ] `npm test` passa (45/45)?
- [ ] `npm run test:e2e` passa (54/54)?
- [ ] Pipeline único: build → unit → Playwright → E2E

### 6. Verificação de Docs
- [ ] `node scripts/verify-docs.mjs` passa sem broken links?
- [ ] Relatório HTML gerado em `docs/reports/<PR>-<data>-<nome>.html`?

### 7. Limpeza
- [ ] `git status` mostra zero arquivos pendentes?
- [ ] Nenhum código morto (exports não importados, funções não chamadas)?

## Regra de Limpeza

**Antes de merge/PR, TODOS os arquivos devem estar commitados.**

Inclui: código, docs, council verdicts, plans, specs, package.json/lock, relatórios.
Verificar com `git status` — zero arquivos pendentes exceto `.gitignore`.

Ver `CONVENTIONS.md` → "Limpeza Pós-Sessão" para checklist completo.

---

## 🔧 CI/CD — Convenções

### Pipeline (`.github/workflows/ci.yml`)

Sequência obrigatória:
1. **Lint** — ESLint
2. **Build** — `npm run build` (Vite)
3. **Unit tests** — `npm test` (Vitest, 45 testes)
4. **Playwright install** — `npx playwright install chromium --with-deps`
5. **E2E tests** — `npm run test:e2e` (Playwright, 54 testes, 1 worker no CI)
6. **Upload report** — `playwright-report/` como artifact

### Concorrência

Para evitar execução duplicada (push + pull_request no mesmo commit):
```yaml
concurrency:
  group: ci-${{ github.head_ref || github.ref }}
  cancel-in-progress: true
```

### Deploy (`.github/workflows/deploy.yml`)

- Gatilho: merge na `main`
- Usa Vercel CLI com secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Produção: https://mileage-flow-manager.vercel.app

### Workers

- CI usa **2 workers** no Playwright (via `playwright.config.ts`)
- Local usa workers ilimitados (padrão Playwright)
- Se flakiness aparecer, testar sharding (`--shard=x/y`)

### Manutenção

- **Dependências**: `npm update` + CI verde em PR separado
- **Node**: manter compat com Node 22+ (GitHub Actions usa Node 24 por padrão)
- **Playwright browsers**: atualizar via `npx playwright install --with-deps`
- **Relatório de falha**: sempre baixar artifact `playwright-report/` e abrir `index.html`
