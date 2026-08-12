# ⚡ Workflow — Quickstart (resumo executivo)

> **Detalhes completos:** [`WORKFLOW.md`](WORKFLOW.md) · **Definições autoritativas:** [`WORKFLOW-MANIFEST.md`](WORKFLOW-MANIFEST.md)
> Carregue os detalhes **on-demand** — este resumo cobre 90% das sessões.

## Início de sessão

1. `npm run session:start` → snapshot + pergunta a **categoria**
2. Carregue APENAS os docs da categoria (lazy loading):

| Categoria | Docs |
|-----------|------|
| feature | `WORKFLOW-QUICKSTART.md` + `conventions/common.md` + `conventions/feature.md` |
| bugfix | `DEBUG.md` + `conventions/common.md` + `conventions/bugfix.md` |
| docs | (só AGENTS.md) |
| refactor | `conventions/common.md` + `conventions/refactor.md` + `ARCHITECTURE.md` |
| chore | (só AGENTS.md) |

> ⚠️ **REGRA DOURADA:** não pré-carregue docs fora da categoria. `WORKFLOW.md`/`MAP.md`
> só on-demand (são os mais pesados).

## Fluxo mínimo (6 passos)

1. `npm run session:start` — inicia sessão
2. Carregar docs da categoria
3. Se **feature**: council-to-superpowers (veredito em `docs/council/`)
4. **Navegação via Gate** — `npm run nav:gate` antes de ler arquivos inteiros
   (CRG padrão; `read` completo só quando a navegação estrutural não bastar)
5. Implementar (TDD quando aplicável)
6. `npm run pre-pr` → PR → `npm run post-pr`

## Scripts essenciais

| Script | Uso |
|--------|-----|
| `npm run check:fast` | Loop local: typecheck + lint + format + test + docs |
| `npm run check:pr` | Réplica do CI (check:fast + build) |
| `npm run pre-pr` | Valida tudo + gera relatório automático |
| `npm run report "desc" --impact-produto "..." --write` | Briefing executivo (deck de slides) |
| `npm run context:audit` | Mede consumo de tokens do workflow |
| `npm run context:trim` | Rota telemetria (events/quality) — mantém ágil |
| `npm run session:end "msg"` | commit + handoff + push em 1 comando |

## Gates essenciais (não puláveis)

- **INTENT** (rule-33): antes de mudar comportamento declare `INTENT: código faz X; teste espera Y; spec diz Z`
- **TWINS** (rule-34): ao corrigir bug, busque o mesmo padrão no projeto todo — declare `TWINS: searched <padrão> — found <N>`
- **AUTH** (rule-35): antes de push/merge irreversível, cite o usuário — `AUTH: usuário disse "<citação>"`
- **Subagente** (rule-38/39): coding e code-review exigem evidência de subagente (`coding:done`/`code-review:done` com `subagent:true`)
- **Report** (rule-08): relatório HTML obrigatório antes do PR
- **Git limpo** (rule-03): pre-push hook bloqueia push com árvore suja

## Nomenclatura de PR

`<tipo> <escopo>: <descrição>` (ex: `fix(ui): campos legíveis no dark mode`).
O título vira o nome do workflow no CI — sem padrão, o CI fica ilegível.

## Checklist pré-PR (resumo)

1. **Integridade financeira** — mutations com inversão espelhada; reversals com custo proporcional
2. **Imutabilidade** — nada de `.sort()`/`.push()` em arrays de `useMemo`/`useState`
3. **Hierarquia** — `useData()` dentro de `DataProvider`; `useAuth()` dentro de `AuthProvider`
4. **UI** — mensagens cumpridas; loading/erro consistentes
5. **Código** — sem `console.log`; sem `as any` injustificado; DRY
6. **Verificação** — `pre-pr` verde; relatório HTML gerado; CI verde no PR

## Contexto & tokens

- Sessão feature carrega **~5.5K tokens** de docs (QUICKSTART + conventions) — economize com
  navegação estrutural (CRG), `context-pack` para tasks e `read` com offset/limit
- Telemetria (`events.jsonl`) cresce ~1.9K linhas/mês — `npm run context:trim` arquiva o excedente
- Skills de contexto: `.pi/skills/context-window-management/` (referência de padrões)

---
*Quickstart — para o fluxo completo consulte `WORKFLOW.md`. Para definições autoritativas, `WORKFLOW-MANIFEST.md`.*
