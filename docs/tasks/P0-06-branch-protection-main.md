# Task Card — Required status checks + proteção de main

| Campo | Valor |
|-------|-------|
| `id` | P0-06 |
| `categoria` | chore |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | blocked ⛔ |
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
- [x] Config desejada versionada em `.github/branch-protection-main.json`.
- [x] Documentado em `docs/GIT-WORKFLOW.md` quais checks são required.
- [ ] Aplicar no GitHub quando branch protection estiver disponível para o repo privado.

## Riscos / Invariantes
- Coordenar com o proprietário do repo; não bloquear fluxo de hotfix sem política.

## Testes obrigatórios
- `gh api repos/andre0787/mileage-flow-manager/branches/main/protection`.

## Evidência de pronto
- JSON da proteção da branch + trecho do GIT-WORKFLOW.
- Evidência atual: GitHub API retorna `403` (`Upgrade to GitHub Pro or make this repository public to enable this feature.`), então a aplicação remota está bloqueada por plano/visibilidade do GitHub.
