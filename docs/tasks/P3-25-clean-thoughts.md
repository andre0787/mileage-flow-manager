# Task Card — Limpar docs/thoughts/ — converter pensamento stale em GitHub Issue

| Campo | Valor |
|-------|-------|
| `id` | P3-25 |
| `categoria` | chore |
| `onda` | P3 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | auditoria ponytail 2026-07-22, item #3 |
| `dependeDe` | — |
| `feedbackRef` | — |

## Objetivo
Converter o único pensamento stale em `docs/thoughts/` para GitHub Issue e remover o arquivo, mantendo a pasta `docs/thoughts/` funcional para usos futuros do `npm run think`.

## Não objetivos
- Não deletar a pasta `docs/thoughts/` (é usada ativamente por `scripts/think.mjs` para registrar novas ideias)
- Não alterar `scripts/think.mjs` (a mecânica de salvar pensamentos continua válida)

## Contexto
`docs/thoughts/` contém 1 arquivo: `2026-07-11-bot-o-de-entrada-sinalizar-apenas-atrasadas-ao-inv-s-de-pend.md` (287 bytes).

A pasta é funcional — o script `scripts/think.mjs` salva novas ideias lá, e `verify-docs.mjs` já a ignora (`line 29`). O pensamento único é de Jul 11 e nunca foi consumido. Deve virar GitHub Issue (se ainda relevante) ou ser deletado.

## Arquivos permitidos
- `docs/thoughts/2026-07-11-bot-o-de-entrada-sinalizar-apenas-atrasadas-ao-inv-s-de-pend.md`
- `docs/IDEIAS.md` (se mover para pendentes)
- GitHub Issues (via `gh` CLI)

## Critérios de aceite
- [ ] Pensamento avaliado: se relevante → GitHub Issue com label `enhancement`; se irrelevante → só deletar
- [ ] Arquivo `.md` removido de `docs/thoughts/`
- [ ] Se virou issue: adicionar referência em `docs/IDEIAS.md` → Pendentes
- [ ] `npm run verify-docs` passa (verify-docs já ignora `docs/thoughts/`)

## Riscos / Invariantes
- Nenhum script depende de arquivos individuais dentro de `docs/thoughts/`. `verify-docs.mjs:29` já exime a pasta inteira.
- A pasta vazia pode ser mantida (git não versiona pastas vazias, mas o `think.mjs` a recria se necessário).

## Testes obrigatórios
- `npm run verify-docs`
- `npm run check:fast`

## Evidência de pronto
- Issue criada no GitHub (se aplicável)
- `ls docs/thoughts/` vazio ou inexistente
