# /sprint — Abrir sprint board

Lê e exibe o AGENDA.md da sprint atual.

1. Ler `docs/AGENDA.md`
2. Mostrar:
   - Meta da sprint
   - Itens pendentes (não checkados)
   - Itens resolvidos (checkados)
3. Perguntar qual item iniciar

## Regras

- Cada item da sprint = branch nova separada
- Nunca acumular itens na mesma branch
- After merge do PR, só iniciar próximo item

## Por sessão

- [ ] Ler `docs/handoff.md` no início
- [ ] Se sessão > 12 turns, atualizar `docs/handoff.md` e considerar `/new`

## Checklist por item

Antes de criar o PR, executar:
- [ ] Código implementado (commits na branch)
- [ ] Relatório HTML gerado em `docs/reports/` via `/report`
- [ ] PR criado para `develop`
- [ ] PR mergeado para `develop`
- [ ] Atualizar `docs/handoff.md` com progresso
- [ ] Só então iniciar próximo item
