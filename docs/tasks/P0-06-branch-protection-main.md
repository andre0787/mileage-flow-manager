# Task Card — Required status checks + proteção de main

| Campo | Valor |
|-------|-------|
| `id` | P0-06 |
| `categoria` | chore |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #6 |
| `dependeDe` | [P0-03] |

## Objetivo
Configurar required status checks e branch protection em `main` no GitHub, para
que gates do CI sejam obrigatórios — não apenas hook local.

## Não objetivos
- Definir a lista final de checks (segue de P0-03/P0-04).

## Contexto
Hooks locais são conveniência, não controle de qualidade. Hoje `main` pode
receber merges sem que o CI estrito seja required (veredito: Revisão B).

## Arquivos permitidos
- `.github/` (settings, se versionado)
- Configuração via `gh api` ou GitHub UI (documentar em `docs/GIT-WORKFLOW.md`)

## Critérios de aceite
- [ ] `main` requer review + CI estrito antes do merge.
- [ ] Force-push desabilitado em `main`.
- [ ] Documentado em `docs/GIT-WORKFLOW.md` quais checks são required.

## Riscos / Invariantes
- Coordenar com o proprietário do repo; não bloquear fluxo de hotfix sem política.

## Testes obrigatórios
- Verificação via `gh api repos/:owner/:repo/branches/main/protection`.

## Evidência de pronto
- JSON da proteção da branch + trecho do GIT-WORKFLOW.
