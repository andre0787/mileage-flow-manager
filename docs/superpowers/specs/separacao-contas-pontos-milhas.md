# Separação de Contas: Pontos vs Milhas

## Objetivo
Separar o modelo de Contas em dois tipos distintos — **Contas de Pontos**
e **Contas de Milhas** — com tipos de origem configuráveis
dinamicamente via tela de Configurações.

## Modelo de Dados

### OrigemType (configurável dinamicamente)

```typescript
interface OrigemType {
  id: string
  name: string
  accountType: 'pontos' | 'milhas'
  color: string
}
```

Exemplos:
| name              | accountType |
|-------------------|-------------|
| Cartão de Crédito | pontos      |
| Clube de Pontos   | pontos      |
| Compra Direta     | milhas      |
| Transferência     | milhas      |
| Bonificação       | milhas      |
| Promoção          | milhas      |

### Account

```typescript
interface Account {
  id: string
  name: string
  ownerId: string
  programId: string
  type: 'pontos' | 'milhas'
  balance: number
  createdAt: string
}
```

### PointEntry (inflows)

```typescript
interface PointEntry {
  id: string
  accountId: string
  origemTypeId: string
  amount: number
  conversionRate?: number  // para transferência pontos → milhas
  date: string
  description?: string
}
```

### Sale (sem mudanças estruturais)

```typescript
interface Sale {
  id: string
  accountId: string  // sempre milhas
  amount: number
  price: number
  buyer: string
  date: string
  status: 'pending' | 'completed' | 'cancelled'
}
```

## Estrutura de Telas

### /configuracoes — Abas dinâmicas

| Aba               | Conteúdo                             |
|-------------------|--------------------------------------|
| Donos             | CRUD donos (já existe)               |
| Programas         | CRUD programas (já existe, vazia)    |
| Tipos de Pontos   | CRUD tipos de origem para pontos     |
| Tipos de Milhas   | CRUD tipos de origem para milhas     |

### /contas — Tipo selecionável no formulário

- Tabela única com badge de tipo (Pontos / Milhas)
- Modal "Nova Conta" com seletor de tipo
- Balance único por conta

### /entradas — Sub-abas

- Aba **Pontos**: entradas com `origemType.accountType === 'pontos'`
- Aba **Milhas**: entradas com `origemType.accountType === 'milhas'`

### /vendas

- Filtro: só contas do tipo `milhas`

## Plano de Implementação

1. Tipos e interfaces
2. Mock data centralizado com hooks
3. Configurações — abas dinâmicas
4. Contas — separação Pontos/Milhas
5. Entradas — sub-abas
6. Vendas — filtro milhas
7. Dashboard — conectar a dados reais (opcional)
