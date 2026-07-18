# Task Card — Estabelecer baseline de formatação

| Campo | Valor |
|-------|-------|
| `id` | P0-08 |
| `categoria` | chore |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | done |
| `origem` | conselho de veredito 2026-07-18, impedimento para P0-03 |
| `dependeDe` | [] |

## Objetivo
Resolver os 44 arquivos que falham no `npm run format:check` atualmente, garantindo um baseline 100% verde para a formatação do projeto sem introduzir alterações semânticas.

## Não objetivos
- Alterar lógica de código, regras de lint ou tipagem.

## Contexto
O card `P0-03` exige que o CI execute checks estritos (incluindo `format:check`). Contudo, o repositório possui atualmente 44 arquivos com inconformidades de formatação de estilo (Prettier), impossibilitando a ativação imediata do check estrito sem quebrar o CI para alterações válidas.

## Arquivos permitidos
- `src/**/*.{ts,tsx,css,json}`
- `docs/tasks/ROADMAP.md` (atualização do roadmap)
- `docs/tasks/P0-08-format-baseline.md` (este card)

## Critérios de aceite
- [ ] `npm run format:check` retorna sucesso (exit code 0).
- [ ] Todos os arquivos modificados preservam integridade semântica (passam nos testes unitários e de integração).

## Riscos / Invariantes
- Nenhum. Prettier apenas reorganiza formatação visual.

## Testes obrigatórios
- `npm run format:check` local verde.
- `npm test` e `npm run typecheck` locais verdes.

## Evidência de pronto
- Logs do `npm run format:check` verde.
