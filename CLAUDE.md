# MilesControl — Instruções para Claude Code

> Projeto de gestão de milhas/pontos (milhagem). Consulte `docs/` para detalhes.

## Sumário Executivo

| O quê | Onde |
|-------|------|
| Stack & comandos | `docs/STACK.md` |
| Arquitetura & pastas | `docs/ARCHITECTURE.md` |
| Convenções de código | `docs/CONVENTIONS.md` |
| Workflow obrigatório | `docs/WORKFLOW.md` |
| Sprint & tarefas | `docs/AGENDA.md` |
| Git & deploy | `docs/GIT-WORKFLOW.md` |
| Testes | `docs/TESTING.md` |
| Mapa completo | `docs/MAP.md` |

## ⚡ Início de Sessão — AUTO

Execute automaticamente no início de cada sessão:

```bash
npm run session:start
```

Isso gera um resumo ~300 tokens com branch, commit, sprint, backlog e regras ativas.
Após o resumo, leia `HANDOFF.md` para contexto completo.

## Regras

1. 🔥 **NUNCA direto na main** — toda alteração em branch, main só via PR
2. Workflow obrigatório: council-to-superpowers para features (veja `docs/WORKFLOW.md`)
3. Grid máximo 2 colunas: `grid-cols-1 sm:grid-cols-2`
4. DRY: regra de negócio em ponto único em `src/lib/`
5. CI/CD obrigatório em todo PR
6. Interface: português (pt-BR)
7. Relatório HTML antes do PR: `npm run report "descrição" --write`
8. HANDOFF.md no início + após PR/merge
9. git status ZERO antes de PR/merge
10. Registrar bugs encontrados em `docs/AGENDA.md` → 🐞 Bugs Encontrados

## Scripts de Workflow

```bash
npm run session:start   # resumo inicial (~300 tokens)
npm run report "x" --write  # relatório HTML automático
npm run pre-pr          # valida build, tests, docs antes do PR
npm run session:end "msg"   # add + commit + handoff + push
npm run handoff         # atualiza HANDOFF.md
npm run think "ideia"   # captura ideia externa no backlog
npm run think "ideia" --immediate  # ideia + council imediato
npm run think "bug: x" --bug       # registra bug
```
