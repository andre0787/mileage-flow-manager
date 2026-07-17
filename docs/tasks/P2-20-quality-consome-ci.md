# Task Card — QUALITY.md consome resultados reais de CI

| Campo | Valor |
|-------|-------|
| `id` | P2-20 |
| `categoria` | docs |
| `onda` | P2 |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #20 |
| `dependeDe` | [P0-03] |

## Objetivo
`QUALITY.md` deve refletir resultados reais de CI (runs, required checks,
flakiness), não apenas a existência de arquivos de workflow.

## Não objetivos
- Construir um dashboard separado (mantém markdown consumindo dados).

## Contexto
O veredito (Advisor The Contrarian) aponta que `QUALITY.md` hoje se baseia em
"existe arquivo" e não em "o check realmente passou". Isso dá falsa confiança.

## Arquivos permitidos
- `QUALITY.md` _(raiz do repo — alvo da sincronização)_
- `scripts/quality-sync.*` (novo, lê CI via `gh` e gera seção)
- `package.json` (atalho)

## Critérios de aceite
- [ ] Seção de QUALITY.md gerada a partir de runs reais (gh api).
- [ ] Indica quais checks são required e seu último estado.
- [ ] Regenerável por comando; não editada manualmente.

## Riscos / Invariantes
- Tolerar indisponibilidade temporária do GitHub (cache/local).

## Testes obrigatórios
- `npm run quality:sync` (ou equivalente) gerando a seção.

## Evidência de pronto
- Trecho gerado de QUALITY.md + comando utilizado.
