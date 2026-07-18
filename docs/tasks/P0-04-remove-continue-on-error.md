# Task Card — Remover `continue-on-error` de checks críticos

| Campo | Valor |
|-------|-------|
| `id` | P0-04 |
| `categoria` | chore |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #4 |
| `dependeDe` | [] |

## Objetivo
Remover `continue-on-error: true` de passos críticos; manter apenas diagnósticos
informativos explicitamente não bloqueantes.

## Não objetivos
- Remover checks informativos legítimos (manter como diagnóstico).

## Contexto
Hoje `lint` usa `continue-on-error: true` (9 warnings tolerados) e o veredito
classifica isso como "um agente obtém resultado verde mesmo quebrando o contrato".

## Arquivos permitidos
- `.github/workflows/*.yml`

## Critérios de aceite
- [ ] Nenhum passo de lint/typecheck/format/rules usa `continue-on-error`.
- [ ] Passos puramente informativos (ex.: bundle report) seguem `continue-on-error`
      e são comentados como diagnósticos.
- [ ] CI falha quando um check crítico falha.

## Riscos / Invariantes
- Pode expor warnings que viram bloqueio; alinhar com P0-07 (drift) antes.

## Testes obrigatórios
- Rodada de CI demonstrando bloqueio em warning/erro.

## Evidência de pronto
- Diff do YAML + log de CI falhando ao introduzir warning.
