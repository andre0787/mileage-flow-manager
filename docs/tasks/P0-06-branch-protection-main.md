# Task Card — Required status checks + proteção de main

| Campo | Valor |
|-------|-------|
| `id` | P0-06 |
| `categoria` | chore |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | done ✅ |
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
- [x] Aplicado no GitHub após tornar o repositório público.

## Riscos / Invariantes
- Coordenar com o proprietário do repo; não bloquear fluxo de hotfix sem política.

## Testes obrigatórios
- `gh api repos/andre0787/mileage-flow-manager/branches/main/protection`.

## Evidência de pronto
- JSON da proteção da branch + trecho do GIT-WORKFLOW.
- API retorna configuração ativa: required_status_checks (`build-and-test`), required_pull_request_reviews (1), enforce_admins habilitado.
