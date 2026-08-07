# Design — Criar Dono + Programa Inline no EntryForm

**Data:** 2026-07-27
**Status:** Aprovado
**Council:** `docs/council/2026-07-27-criar-dono-programa-inline-veredito.md`

## Motivação

Atualmente o EntryForm permite criar conta inline (PR #203), mas exige que dono e programa já existam no banco. Se o usuário precisa de um novo dono ou programa, é forçado a sair do fluxo, ir para Configurações, criar, voltar e recomeçar. Isso quebra o princípio de continuidade.

## Abordagem

**FormDrawer aninhado** — mesmo padrão estabelecido no PR #203 (`onCreateOrigemType`, `onCreateAccount`). Botões "+" ao lado dos selects de Dono e Programa abrem drawers separados com formulários de cadastro rápido.

## Props novas no EntryForm

```ts
interface EntryFormProps {
  // ... props existentes ...

  onCreateOwner?: (data: {
    name: string;
    cpf?: string;
    phone?: string;
  }) => Promise<string | undefined>;

  onCreateProgram?: (data: {
    name: string;
    type: "pontos" | "milhas";
  }) => Promise<string | undefined>;
}
```

## Novos estados no EntryForm

```ts
const [isOwnerOpen, setIsOwnerOpen] = useState(false);
const [newOwner, setNewOwner] = useState({ name: "", cpf: "", phone: "" });
const [isCreatingOwner, setIsCreatingOwner] = useState(false);
const [ownerErrors, setOwnerErrors] = useState<Record<string, string>>({});

const [isProgramOpen, setIsProgramOpen] = useState(false);
const [newProgram, setNewProgram] = useState({ name: "", type: "pontos" as const });
const [isCreatingProgram, setIsCreatingProgram] = useState(false);
const [programErrors, setProgramErrors] = useState<Record<string, string>>({});
```

## UI — Owner Drawer

```
┌─ FormDrawer "Novo Dono" ───────────┐
│  Nome *       [________________]   │
│  CPF (opc)    [________________]   │
│  Telefone(opc)[________________]   │
│                                     │
│          [Cancelar]  [Cadastrar]    │
└─────────────────────────────────────┘
```

- Validação: nome obrigatório
- Após criar: `setNewAccount({ ...newAccount, ownerId: id })` + fecha drawer

## UI — Program Drawer

```
┌─ FormDrawer "Novo Programa" ───────┐
│  Nome *       [________________]   │
│  Tipo *       [Pontos ▼]           │
│                                     │
│          [Cancelar]  [Cadastrar]    │
└─────────────────────────────────────┘
```

- Validação: nome obrigatório, tipo obrigatório
- Após criar: `setNewAccount({ ...newAccount, programId: id })` + fecha drawer
- `useAddProgramMutation` já cria origem_type automaticamente para programas de pontos (type="pontos" → upsert em origens com cor #3b82f6)

## Fluxo completo

```
EntryForm (drawer principal de criação de entrada)
  └── Button "➕" → Account Drawer
        ├── Select Dono + [➕ Novo Dono]
        │     └── Owner Drawer → cria → seleciona dono → fecha
        ├── Select Programa + [➕ Novo Programa]
        │     └── Program Drawer → cria → seleciona programa → fecha
        ├── Nome da Conta + Tipo (deduzido do programa)
        └── [Cadastrar] → conta criada → entry form seleciona conta
```

## Parent handlers (Entradas.tsx)

```ts
const addOwnerM = useAddOwnerMutation();
const addProgramM = useAddProgramMutation();

const handleCreateOwner = async ({ name, cpf, phone }) => {
  const id = crypto.randomUUID();
  await addOwnerM.mutateAsync({ id, name, cpf: cpf ?? "", phone: phone ?? "" });
  return id;
};

const handleCreateProgram = async ({ name, type }) => {
  const id = crypto.randomUUID();
  await addProgramM.mutateAsync({ id, name, type });
  return id;
};
```

Passar para EntryForm:
```tsx
<EntryForm
  ...
  onCreateOwner={handleCreateOwner}
  onCreateProgram={handleCreateProgram}
/>
```

## Arquivos alterados

| Arquivo | Tipo | Mudanças |
|---------|------|----------|
| `src/components/EntryForm.tsx` | Modificação | +2 props, +2 drawers, ~100 linhas |
| `src/pages/Entradas.tsx` | Modificação | +imports, +hooks, +handlers, +props |
| Testes | Criação/Modificação | Cobrir fluxo criar dono → programa → conta → entrada |

## Testes

- **Teste unitário:** validar que `onCreateOwner` é chamado com dados corretos, que owner é selecionado após criação
- **Teste unitário:** validar que `onCreateProgram` é chamado com dados corretos, que program é selecionado após criação
- **Teste E2E (recomendado):** fluxo completo: criar dono → criar programa → criar conta → criar entrada

## Considerações de UX

- Drawers usam portal (FormDrawer → Sheet shadcn), não há aninhamento real de DOM
- Scroll do drawer pai não é afetado pelo drawer filho
- Ao fechar drawer filho sem salvar, estado do drawer pai (conta) é preservado
- Seed "Pontos" como padrão no tipo do programa (mais comum)
