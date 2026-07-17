# Task Card — Estados verificáveis do workflow

| Campo | Valor |
|-------|-------|
| `id` | P1-11 |
| `categoria` | feat |
| `onda` | P1-A |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #11 |
| `dependeDe` | [P1-08] |

## Objetivo
Definir estados simples e verificáveis: `explore`, `planned`, `implementing`,
`verified`, `review`, `done`. Cada estado tem comando de entrada/saída e evidência
pequena em `docs/work/` (ou artefato de CI).

## Não objetivos
- Estado transitório fino demais (manter 6 estados, não dezenas).
- Bloquear trabalho exploratório legítimo (Revisão E: modo `explore`).

## Contexto
Hoje não há máquina de estados explícita; o agente infere o passo seguinte
lendo dezenas de arquivos. O veredito (Chairman) recomenda transformar o
workflow em uma máquina de estados pequena e fail-closed.

## Arquivos permitidos
- `docs/work/` (novo, artefatos de estado — .gitkeep)
- `scripts/task-state.*` (novo, transições)
- `package.json` (atalhos)
- `docs/tasks/_TEMPLATE.md` (campo `estado` já existe)

## Critérios de aceite
- [ ] 6 estados com transições válidas documentadas.
- [ ] `task:state <id> <novo>` valida transição legal e registra evidência.
- [ ] Modo `explore` não exige card/plano; modo `change` exige.
- [ ] Existe teste para transição inválida (ex.: `done` → `implementing`).

## Riscos / Invariantes
- Não acoplar a git internals além do necessário (usar arquivos em `docs/work/`).

## Testes obrigatórios
- `npm test` (transições válidas/inválidas)

## Evidência de pronto
- Lista de transições + exemplo de artefato em `docs/work/`.
