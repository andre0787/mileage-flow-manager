# Account Dialog — Design de Criação/Edição de Contas

## Contexto
A página de Contas (`src/pages/Contas.tsx`) possui um dialog de criação de conta com problemas de UX: tipo de conta selecionado manualmente, sem auto-derivação do programa, sem campos financeiros, sem diálogo de edição, sem criação inline de dono/programa.

## Objetivo
Reformular a experiência de criação e edição de contas, unificando CRUD em um único componente reutilizável.

## Alterações

### 1. Novo Componente: `AccountDialog`
**Arquivo:** `src/components/AccountDialog.tsx`

Dialog único que serve para criar e editar contas. Recebe `mode: 'create' | 'edit'` e opcionalmente `account` para edição.

### 2. Campos do Dialog

| Campo | Tipo | Regras |
|-------|------|--------|
| Nome da Conta | Input text | Obrigatório |
| Programa | Select + botão "+" | Obrigatório. Ao selecionar, auto-deriva o campo Tipo |
| Tipo de Conta | Select (Pontos/Milhas) | **Pré-preenchido** automaticamente ao selecionar programa. Pode ser sobrescrito manualmente |
| Dono | Select + botão "+" | Obrigatório |
| Saldo Inicial | Input number | Opcional, default 0 |
| Custo/Milha (avgCostPerMile) | Input number | Opcional |
| Valor Investido (totalInvested) | Input number | Opcional |
| Status | Switch | Ativa/Inativa, default Ativa |

### 3. Sub-dialogs Inline

**Sub-dialog Programa:**
- Campos: Nome (text), Tipo (select Pontos/Milhas)
- Ao salvar: adiciona ao contexto, seleciona no campo Pai, fecha sub-dialog
- Acionado por botão "+" ao lado do Select de Programa

**Sub-dialog Dono:**
- Campos: Nome (text), CPF (text), Telefone (text)
- Ao salvar: adiciona ao contexto, seleciona no campo Pai, fecha sub-dialog
- Acionado por botão "+" ao lado do Select de Dono

### 4. Edição
- Botão de editar (lápis) nos cards passa a abrir `AccountDialog` com `mode="edit"` e `account` preenchido
- Mesmos campos, mesmas validações
- Ao salvar, chama `updateAccount`
- Sub-dialogs de criação funcionam também no modo edição

### 5. Integração com `Contas.tsx`
- Extrair o dialog atual para `AccountDialog`
- Conectar botão de editar (lápis) ao dialog
- Remover estado `newAccount` e `accountErrors` do `Contas.tsx`

### 6. Data Flow
- `AccountDialog` recebe `mode`, `account?`, `onClose?` como props
- Usa `useData()` para acesso a owners, programs, accounts
- Auto-deriva type: quando `programId` muda, busca `programs.find(p => p.id === programId)?.type` e **pré-preenche** o campo Tipo de Conta. Usuário pode sobrescrever manualmente se desejar
- Sub-dialogs também usam `useData()` para `addOwner` / `addProgram`

### 7. Validação
- Nome obrigatório
- Dono obrigatório
- Programa obrigatório
- Saldo inicial: número não negativo
- Custo/milha e valor investido: número positivo (se preenchido)

### 8. Mock Data
Nenhuma alteração nos dados mock.

### 9. Arquivos Alterados
- `src/pages/Contas.tsx` — extrair dialog, conectar edição
- `src/components/AccountDialog.tsx` — novo componente
- Nenhuma alteração em types, context, ou outras páginas

## Não Escopo
- Inline create/edit de Tipo de Operação (fora do escopo de Contas)
- Validação de CPF/Telefone no sub-dialog de Dono
- Paginação ou busca em listas grandes
