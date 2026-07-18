# Task Card — Separar check:fast / check:pr / check:nightly

| Campo | Valor |
|-------|-------|
| `id` | P1-14 |
| `categoria` | chore |
| `onda` | P1-B |
| `baseBranch` | main |
| `estado` | pending |
| `origem` | veredito 2026-07-17, item #14 |
| `dependeDe` | [P1-13] |

## Objetivo
Separar três níveis de verificação:
- `check:fast`: format, typecheck, lint, unit, regras.
- `check:pr`: fast + build + smoke/fluxos críticos.
- `check:nightly`: full E2E remoto, acessibilidade, bundle, docs health.

## Não objetivos
- Tornar full E2E obrigatório em todo commit (isso incentiva bypass — veredito).

## Contexto
Hoje não há separação clara entre "rápido para feedback local", "porta de PR" e
"integração pesada". Isso ou atrasa o dev ou incentiva pular o check.

## Arquivos permitidos
- `package.json` (atalhos `check:fast`, `check:pr`, `check:nightly`)
- `.github/workflows/*.yml` (PR roda `check:pr`; nightly roda `check:nightly`)

## Critérios de aceite
- [ ] Três atalhos definidos e documentados.
- [ ] CI de PR roda `check:pr`; workflow separado roda `check:nightly` (schedule).
- [ ] `check:fast` executa em < tempo-alvo (medir e registrar baseline).

## Riscos / Invariantes
- Não duplicar lógica; compor passos, não reescrever.

## Testes obrigatórios
- `npm run check:fast`, `npm run check:pr` local.
- `check:nightly` pode rodar manualmente se Supabase remoto indisponível.

## Evidência de pronto
- package.json + YAMLs + tempos medidos.
