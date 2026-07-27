# Design Spec — Criação inline de conta no EntryForm

**Data:** 2026-07-24
**Escopo:** Adicionar botão "+" para criar conta inline no formulário de entrada, seguindo o padrão existente de criação inline de Tipo de Origem.

## Contexto

O `EntryForm` já permite criar Tipo de Origem inline via `onCreateOrigemType`. O mesmo padrão será aplicado ao campo de Conta, que atualmente é apenas um `Select` sem opção de criação.

## Props

```typescript
onCreateAccount?: (data: {
  name: string;
  ownerId: string;
  programId: string;
}) => Promise<string | undefined>;
```

Retorna o `id` da conta criada para auto-selecionar no form, ou `undefined` em caso de erro.

## UI

### Botão "+" no Select de Conta

Apenas no modo `mode === "create"`. Posicionado ao lado do `SelectTrigger`, mesma disposição visual do botão de Tipo de Origem.

### FormDrawer "Nova Conta"

Campos:
- **Nome da Conta** — input text, obrigatório
- **Dono** — select com lista de `owners` (prop já existente), obrigatório
- **Programa** — select com lista de `programs` (prop já existente), obrigatório
- Tipo da conta: derivado automaticamente do programa selecionado (campo oculto)
- Saldo inicial: 0 (fixo)
- Status: "ativa" (fixo)

### Validação

- Nome obrigatório
- Dono obrigatório
- Programa obrigatório

### Comportamento

1. Usuário clica `+` → abre FormDrawer
2. Preenche nome, seleciona dono e programa
3. Clica "Cadastrar" → chama `onCreateAccount` → retorna ID → auto-seleciona no form principal
4. Fecha o FormDrawer

## Mutação

Em `Entradas.tsx`, usar `useAddAccountMutation()` já existente com `mutateAsync`.

```typescript
const addAccountM = useAddAccountMutation();

const handleCreateAccount = async (data) => {
  const program = programs.find(p => p.id === data.programId);
  const id = crypto.randomUUID();
  await addAccountM.mutateAsync({
    id,
    name: data.name,
    ownerId: data.ownerId,
    programId: data.programId,
    type: program!.type,
    balance: 0,
    status: "ativa",
    createdAt: new Date().toISOString().split("T")[0],
  });
  return id;
};
```

## Testes

- Teste manual com usuário de testes:
  1. Abrir formulário de nova entrada
  2. Clicar "+" ao lado de Conta
  3. Preencher nome, selecionar dono, selecionar programa
  4. Cadastrar → conta aparece selecionada no form
  5. Preencher resto da entrada e salvar
  6. Verificar que entrada foi criada na conta correta

## Limitações / Fora de escopo

- Não cria dono ou programa aninhado (apenas seleciona existentes)
- Não altera `TransferForm` ou `SaleForm` (PR separado se necessário)
- Não reusa `AccountDialog` (usar FormDrawer inline para consistência visual)
- Disponível apenas no modo `create`, não no `edit`
