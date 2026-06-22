# Design: Transferência como Tipo de Origem Nativo

## Contexto
O tipo de origem "Transferência" (usado para entrada de milhas via conversão de pontos) foi perdido durante limpeza de dados. Ele precisa ser restaurado como um tipo nativo/protegido que o usuário não pode apagar.

## O que muda

### 1. DataContext (`src/contexts/DataContext.tsx`)
- Definir `TRANSFERENCIA_ID = "builtin-transferencia"`
- `initialOrigemTypes` já inicia com a Transferência:
  - `{ id: TRANSFERENCIA_ID, name: "Transferência", accountType: "milhas", color: "#8b5cf6" }`
- `deleteOrigemType`: se `id === TRANSFERENCIA_ID`, não faz nada (log silencioso)
- Garantir que a Transferência persista (já está em `initialOrigemTypes`, então salva em localStorage)

### 2. Configuracoes (`src/pages/Configuracoes.tsx`)
- Na aba "Tipo de Operação", filtrar `milhasTypes` para excluir a Transferência da lista editável, OU
- Mostrar a Transferência como item protegido:
  - Badge "Nativo" ao lado do nome
  - Sem botões de editar/excluir
  - Tooltip "Tipo de operação nativo do sistema"

### 3. Entradas (`src/pages/Entradas.tsx`)
- Mudar detecção de transferência:
  - De: `selectedOrigemType?.name === "Transferência"` (frágil)
  - Para: `selectedOrigemType?.id === TRANSFERENCIA_ID` (robusto)
- Importar/definir `TRANSFERENCIA_ID` (pode importar do DataContext ou definir constante local)

### 4. Nenhuma mudança no fluxo de negócio
- O comportamento de transferência (sourceAccount, bonus, custo calculado) permanece idêntico
- Apenas a identificação do tipo de origem fica por ID fixo em vez de nome

## Arquivos afetados
- `src/contexts/DataContext.tsx`
- `src/pages/Configuracoes.tsx`
- `src/pages/Entradas.tsx`
