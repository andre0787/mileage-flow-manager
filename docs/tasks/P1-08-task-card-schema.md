# Task Card — task-card.schema.json + npm run task:validate

| Campo | Valor |
|-------|-------|
| `id` | P1-08 |
| `categoria` | feat |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #8 |
| `dependeDe` | [] |

## Objetivo
Definir o schema canônico de task-card e um validador `npm run task:validate`
que todo card em `docs/tasks/` deve satisfazer.

## Não objetivos
- Criar o `context:pack` (P1-09).
- Validar correspondência diff↔card (P1-10).

## Contexto
Um modelo menor precisa de um contrato estruturado em vez de prosa. O veredito
(First Principles Thinker) define campos mínimos; hoje não há schema nem
validação — os cards atuais são markdown informal.

## Arquivos permitidos
- `docs/task-card.schema.json` (novo)
- `scripts/task-validate.*` (novo)
- `package.json` (atalho `task:validate`)
- `docs/tasks/_TEMPLATE.md` (alinhar campos)

## Critérios de aceite
- [ ] Schema define: `id`, `categoria`, `objetivo`, `naoObjetivos`,
      `criteriosAceite`, `arquivosPermitidos`, `riscos`, `testesObrigatorios`,
      `estado`, `baseBranch`.
- [ ] `npm run task:validate` valida todos os cards em `docs/tasks/`.
- [ ] Falha com mensagem clara para card sem campo obrigatório.

## Riscos / Invariantes
- Não quebrar parsing dos cards já criados (migrar se necessário).

## Testes obrigatórios
- `npm test` (teste positivo com card válido + negativo com card inválido)
- `npm run task:validate`

## Evidência de pronto
- Schema + script + saída de validação em todos os cards atuais.
