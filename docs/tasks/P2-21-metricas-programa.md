# Task Card — Métricas do programa

| Campo | Valor |
|-------|-------|
| `id` | P2-21 |
| `categoria` | feat |
| `onda` | P2 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #21 |
| `dependeDe` | [P0-06] |

## Objetivo
Medir: taxa de PR verde na primeira tentativa, falhas por categoria, tempo até
verificação, reabertura/retrabalho, skips E2E e bypasses `--no-verify`.

## Não objetivos
- Coletar telemetria de usuários finais (somente meta de engenharia).

## Contexto
O programa precisa medir se realmente melhora a execução para modelo menor.
Sem métrica, "parece melhor" não é sinal (veredito: The Expansionist).

## Arquivos permitidos
- `scripts/metrics/*` (novo)
- `docs/metrics/` ( snapshots versionados, opcional)
- `package.json` (atalho)

## Critérios de aceite
- [ ] Coleta via GitHub API (PRs, checks, retries) em comando único.
- [ ] Métricas cobrem: verde-na-1ª, falhas por categoria, tempo até verificação,
      retrabalho, skips E2E, bypasses.
- [ ] Relatório gerado em markdown ou JSON.

## Riscos / Invariantes
- Privacidade: nenhuma métrica pessoal de usuário final.

## Testes obrigatórios
- `npm run metrics:collect` (ou equivalente) com saída de exemplo.

## Evidência de pronto
- Relatório de métricas de um período amostral.
