# Design: Ajustes na Tela de Vendas

## Objetivo
- Habilitar criação inline de clientes no modal de vendas (nested dialog, padrão AccountDialog)
- Limitar vendas apenas a contas do tipo "milhas"
- Tornar o estoque (stockInfo) dinâmico via DataContext

## 1. Estoque Dinâmico via DataContext

Substituir `stockInfo` hardcado. Derivar via `useMemo` de `accounts`, `owners`, `programs`:

```
accounts
  .filter(a => a.type === "milhas" && a.status === "ativa")
  .map(a => ({
    accountId: a.id,
    ownerId: a.ownerId,
    ownerName: owners.find(o => o.id === a.ownerId)?.name ?? "",
    accountName: a.name,
    program: programs.find(p => p.id === a.programId)?.name ?? "",
    availableMiles: a.balance,
    averageCostPerMile: a.averageCostPerMile ?? 0
  }))
```

Os owners do select vêm do DataContext, filtrados apenas por quem tem conta milhas ativa. Programas são dinâmicos do context, não do `stockInfo[].program`.

## 2. Filtro "Só Milhas"

- Select de programa só mostra contas `type === "milhas"` — derivado naturalmente do filtro do estoque
- Cálculo de lucro: custo/milha × milhas usadas (mantido igual)

## 3. Criação Inline de Cliente

Padrão nested dialog igual ao `AccountDialog`:

- Botão "+" ao lado do select de cliente
- Abre `Dialog` aninhado com campos: Nome, CPF (formatado), E-mail, Telefone
- `onSave` → `addClient()` do DataContext, auto-seleciona o novo cliente
- Formatação CPF: mesma lógica de `Clientes.tsx`

## 4. Interface Sale

Manter a interface local `Sale` em `Vendas.tsx` (não alinhar com global por enquanto).

## Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Vendas.tsx` | Remover stockInfo hardcoded; adicionar accounts/owners/programs/addClient do context; nested dialog de cliente; filtro milhas; formatação CPF |

## Não Escopo
- Migrar vendas para DataContext
- Schemas Zod
- Extrair componente de formulário de cliente reutilizável