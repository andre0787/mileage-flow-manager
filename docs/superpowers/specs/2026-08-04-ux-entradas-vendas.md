# Spec — UX Entradas & Vendas

> **Data:** 2026-08-04 | **Branch:** `feat/ux-entradas-vendas`
> **Fonte:** veredito do council `docs/council/2026-08-04-ux-entradas-vendas-veredito.md` (✅ Faça)

## Objetivo

4 melhorias de UX em Entradas e Vendas (desktop + mobile):

1. **Scroll por mouse funcional no PC** — fix CSS raiz (`overflow-x: clip` no body)
2. **Ordenação por colunas** em Entradas e Vendas (default: data desc)
3. **Filtro por dono** (Select) em Entradas e Vendas — como Dashboard/Relatórios
4. **Sanitização dos tipos de origem** no cadastro de entrada (filtro defensivo, sem DELETE)

## Decisões técnicas

| Item | Abordagem | Arquivos |
|------|-----------|----------|
| Scroll | `body{overflow-x:clip}` + `html{overflow-x:hidden}` | `src/index.css` |
| Ordenação | Funções puras `sortByKey`/`toggleSort` em lib (cópia antes de sort) + headers clicáveis em `EntryTable`/`SaleTable` com indicador ↑/↓ | `src/lib/sort.ts` (novo), `src/components/ui/SortableHeader.tsx` (novo), `src/components/EntryTable.tsx`, `src/components/SaleTable.tsx` |
| Filtro dono | Componente `OwnerFilter` (Select) + filtro por `accountId ∈ contas(dono)` | `src/components/ui/OwnerFilter.tsx` (novo), `src/pages/Entradas.tsx`, `src/pages/Vendas.tsx` |
| Sanitização | Helper `isJunkOrigemTypeName()` + dedupe case-insensitive no select | `src/lib/origemTypes.ts`, `src/components/EntryForm.tsx`, `src/components/OrigemTypeSection.tsx` |

## Critérios de aceite

- [ ] Wheel do mouse rola a página em desktop (playwright: wheel → scrollY > 0)
- [ ] Clicar em header de coluna ordena asc/desc com indicador; default data desc
- [ ] Select "Todos os Donos"/dono filtra entradas e vendas; Vendas combina com status
- [ ] Select de origem esconde tipos sujos (vazio/whitespace/n-a/teste/e2e) e duplicados
- [ ] Nenhum array de `useMemo`/`useState` é mutado (cópia antes de sort)
- [ ] Tests unit (hook + helper) e e2e (scroll, ordenação, filtro dono)
- [ ] pre-pr 0 errors

## Fora de escopo

- DELETE físico de tipos sujos no banco (apresentar nomes reais ao usuário pós-PR)
- Sorting no DataTable do Relatórios (manter foco Entradas/Vendas)