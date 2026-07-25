# Council Veredito — Criação inline de conta no EntryForm

**Data:** 2026-07-24
**Tópico:** Adicionar criação inline de conta ao registrar entrada

## Participantes

- The Contrarian
- First Principles Thinker
- The Expansionist
- The Outsider
- The Executor (Chairman)

## Veredito Final

**Faça** ✅ — unânime.

## Decisões

| Tópico | Decisão |
|--------|---------|
| Abordagem | FormDrawer inline (mesmo padrão do `onCreateOrigemType`) |
| Campos | nome, dono (select), programa (select) |
| Saldo inicial | Zero (a entrada ajusta via mutation) |
| Tipo | Derivado automaticamente do programa |
| Dono/Programa | Usar listas existentes, sem criação aninhada |

## Próximos Passos

1. Brainstorming → spec detalhada
2. Branch `feat/entry-create-account`
3. Implementar no EntryForm + Entradas.tsx
4. Pre-PR + relatório
