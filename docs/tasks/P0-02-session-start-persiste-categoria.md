# Task Card — session:start persiste categoria/objetivo/branch

| Campo | Valor |
|-------|-------|
| `id` | P0-02 |
| `categoria` | fix |
| `onda` | P0 |
| `baseBranch` | main |
| `estado` | done |
| `origem` | veredito 2026-07-17, item #2 |
| `dependeDe` | [] |

## Objetivo
`npm run session:start` deve perguntar a categoria (quando em modo de mudança),
persistir categoria/objetivo/branch no handoff e falhar se categoria não for
informada em modo `change`.

## Não objetivos
- Redesenhar o handoff inteiro (isso é P0-07 em parte).
- Criar máquina de estados (isso é P1-11).

## Contexto
A documentação (`AGENTS.md`, passo 1 do workflow mínimo) promete que
`session:start` pergunta a categoria, mas o veredito observou que isso não
acontece; a categoria não está persistida de forma confiável no handoff.

## Arquivos permitidos
- `scripts/session-start.*` (localizar pelo package.json)
- `docs/handoff.md` (campo categoria/objetivo/branch, gerado)
- `package.json` (se o atalho mudar)

## Critérios de aceite
- [x] `session:start` em modo mudança requer categoria; ausência ⇒ erro não-zero.
- [x] Handoff pós-`session:start` contém branch e commit atuais (sem drift).
- [x] Existe teste (unitário ou de script) cobrindo o caminho sem categoria.
  - `tests/unit/scripts-session-start.test.ts` — 3 testes: inválido, sem-args, válido

## Riscos / Invariantes
- Não quebrar o uso já existente do handoff por outros scripts.
- Snapshot automático continua sendo gerado por `handoff:snapshot`.

## Testes obrigatórios
- `npm test` (novo teste de script)
- rodar `session:start` manualmente e conferir handoff.

## Evidência de pronto
- Output do `session:start` + trecho do handoff atualizado.
