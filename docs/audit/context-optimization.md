# Otimização do context-pack

Data: 2026-08-22

## Política aplicada

- `public/mock/`, `docs/reports/`, `docs/tracking/`, `dist/`, `node_modules/` e `coverage/` são excluídos por padrão.
- Arquivos auxiliares acima de 15 KiB são excluídos por padrão; `explicit=true` permite solicitação explícita.
- A política está centralizada em `shouldIncludeContextFile()` em `scripts/context-pack.mjs`.

## Medição reproduzível

Task card de referência: `P1-13`.

| Modo | Bytes | Tokens estimados |
|---|---:|---:|
| Completo | 9.999 | ~2.432 |
| Compacto | 5.286 | ~1.283 |
| Redução compacto vs completo | 47,1% | 47,3% |

Comando: `npm run context:pack -- --task P1-13 [--compact] --out <arquivo>`.

A medição compara os dois modos suportados pelo mesmo script; a redução contra versões históricas depende do card e deve ser repetida quando o card mudar.
