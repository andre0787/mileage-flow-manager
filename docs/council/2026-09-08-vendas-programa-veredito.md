# Council — filtro + coluna de programa na aba Vendas (veredito)

Data: 2026-09-08 · Roster: `oracle` (fork) + `reviewer` · Passes: 1 (convergência, sem disputa material) · Runs: first-principles `8acb0d52`, challenge `44294555`

## Pergunta e escopo

Adicionar na aba Vendas: (a) filtro superior por programa; (b) coluna Programa na tabela inferior antes de Milhas. UI de listagem apenas — sem mudar SaleForm, limites, backend ou CSV (já exporta `Programa`).

## Recomendação

1. Filtro espelhando `OwnerFilter` (componente dedicado ou Select no mesmo padrão/responsividade), estado `"todos"|id`, +1 predicado AND no memo `filteredSales` existente.
2. Desdobrar a coluna combinada `Dono/Programa` em `Dono | Programa` antes de `Milhas`, com chaves de sort separadas; mobile card inalterado.
3. `todos` inclui vendas sem programa (ex. serviço com `program=""`).

## Feedback aceito (com motivo)

- Semântica `s.program` (nome vs id) deve ser checada no código antes de codar — `Sale.program: string` vs `Program{id,name}`; igualdade sobre nome normalizado.
- AND redundante filtro-exato + busca-substring em programa: aceitável, busca é livre e filtro é exato.
- `EmptyState` e export via `filteredSales` já consistentes — sem trabalho extra.
- Testes de coluna/contagem em `SaleTable.test.tsx` precisam atualização (quebra silenciosa).

## Feedback rejeitado (com motivo)

- Duplicar `Programa` sem tocar em `Dono/Programa` — duplica informação.
- Coluna no card mobile — escopo desktop; mobile mantém empilhado.
- Tocar `SaleForm`/backend/CSV ou filtrar por `id` sem mapear nome — fora do escopo.

## Decisões do dono

- Sem Pass 2: sem disputa material (acordo no núcleo; nuance de sort resolvida acima).
- Implementador fecha o gap nome-vs-id lendo como `s.program` é gravado e escolhe igualdade normalizada.

## Confiança

Alta para o desenho; o que mudaria: descobrir que `s.program` guarda `id` (aí o filtro mapeia id→nome nas opções).
