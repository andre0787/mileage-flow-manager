# Reformulação Configurações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar a página de Configurações e ajustar relacionamentos entre Donos, Programas, Contas e Entradas.

**Architecture:** Mudanças concentradas em `types/index.ts` (novo campo em Program), `DataContext.tsx` (mock data), `Configuracoes.tsx` (tabs, dialogs), `Entradas.tsx` (origem de pontos via programs), `Contas.tsx` (display). Sem novas dependências. Tudo mock data.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS + shadcn/ui

---

### Task 1: Adicionar campo `type` em Program

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Atualizar interface Program**

```typescript
export interface Program {
  id: string
  name: string
  type: 'pontos' | 'milhas'
}
```

---

### Task 2: Atualizar mock data de Programs

**Files:**
- Modify: `src/contexts/DataContext.tsx`

- [ ] **Step 1: Adicionar `type` nos programs iniciais**

```typescript
const initialPrograms: Program[] = [
  { id: "1", name: "LATAM Pass", type: "milhas" },
  { id: "2", name: "Smiles", type: "milhas" },
  { id: "3", name: "Livelo", type: "pontos" },
  { id: "4", name: "Esfera", type: "pontos" },
];
```

---

### Task 3: Atualizar dialog de Programas em Configuracoes

**Files:**
- Modify: `src/pages/Configuracoes.tsx`

- [ ] **Step 1: Atualizar estado `newProgram` e `editingProgram`**

```typescript
const [newProgram, setNewProgram] = useState({ name: "", type: "milhas" as Program["type"] });
const [editingProgram, setEditingProgram] = useState<Program | null>(null);
```

- [ ] **Step 2: Adicionar campo "Tipo" no dialog de Programas**

No JSX do dialog de Programas, após o campo "Nome do Programa", adicionar:

```typescript
<div className="space-y-2">
  <Label htmlFor="programType">Tipo</Label>
  <Select value={newProgram.type} onValueChange={(value) => setNewProgram({ ...newProgram, type: value as Program["type"] })}>
    <SelectTrigger>
      <SelectValue placeholder="Selecione o tipo" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="pontos">Programa de Pontos</SelectItem>
      <SelectItem value="milhas">Programa de Milhas</SelectItem>
    </SelectContent>
  </Select>
</div>
```

- [ ] **Step 3: Atualizar `handleEditProgram` e `resetProgramDialog`**

```typescript
const handleEditProgram = (program: Program) => {
  setEditingProgram(program);
  setNewProgram({ name: program.name, type: program.type });
  setIsProgramDialogOpen(true);
};
```

```typescript
const resetProgramDialog = () => {
  setNewProgram({ name: "", type: "milhas" });
  setEditingProgram(null);
  setProgramError("");
  setIsProgramDialogOpen(false);
};
```

- [ ] **Step 4: Mostrar o tipo na tabela de Programas**

Adicionar coluna "Tipo" na tabela, entre "Programa" e "Ações":

```typescript
<TableHead>Tipo</TableHead>
```

Na celula do corpo:

```typescript
<TableCell>
  <Badge variant={program.type === "pontos" ? "secondary" : "default"}>
    {program.type === "pontos" ? "Pontos" : "Milhas"}
  </Badge>
</TableCell>
```

---

### Task 4: Renomear "Tipos de Milhas" para "Tipo de Operação"

**Files:**
- Modify: `src/pages/Configuracoes.tsx`

- [ ] **Step 1: Alterar label da tab**

No `<TabsTrigger value="origem-milhas">`:

```typescript
<TabsTrigger value="origem-milhas" className="gap-2">
  <Palette className="h-4 w-4" />
  Tipo de Operação
</TabsTrigger>
```

- [ ] **Step 2: Alterar titulo do Card e subtitulo**

No `<TabsContent value="origem-milhas">`:

```typescript
<CardTitle className="flex items-center gap-2">
  <Palette className="h-5 w-5 text-primary" />
  Tipos de Operação
</CardTitle>
```

```typescript
<p className="text-sm text-muted-foreground">
  {milhasTypes.length} tipo(s) de operação cadastrado(s)
</p>
```

- [ ] **Step 3: Alterar label do botão de criar**

```typescript
<Button ...>
  <Plus className="h-4 w-4" />
  Nova Operação
</Button>
```

- [ ] **Step 4: Alterar título do Dialog**

```typescript
<DialogTitle>{editingOrigemType ? "Editar Operação" : "Nova Operação"}</DialogTitle>
```

---

### Task 5: Remover aba "Tipos de Pontos"

**Files:**
- Modify: `src/pages/Configuracoes.tsx`

- [ ] **Step 1: Remover tab `TabsTrigger` para `origem-pontos`**

Remover todo o bloco:

```typescript
<TabsTrigger value="origem-pontos" className="gap-2">
  <Palette className="h-4 w-4" />
  Tipos de Pontos
</TabsTrigger>
```

- [ ] **Step 2: Remover todo o `TabsContent` para `origem-pontos`**

Remover do `<TabsContent value="origem-pontos" ...>` até seu fechamento `</TabsContent>`.

- [ ] **Step 3: Remover a variável `pontosTypes`** (não usada em mais nenhum lugar)

```typescript
// Remover esta linha:
const pontosTypes = origemTypes.filter(ot => ot.accountType === "pontos");
```

---

### Task 6: Adicionar contagem de contas na tabela de Donos

**Files:**
- Modify: `src/pages/Configuracoes.tsx`

- [ ] **Step 1: Adicionar coluna "Contas" na tabela de Donos**

Adicionar `<TableHead>Contas</TableHead>` entre Telefone e Ações.

No corpo, adicionar celula:

```typescript
<TableCell>
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
    {accounts.filter(a => a.ownerId === owner.id).length}
  </span>
</TableCell>
```

- [ ] **Step 2: Atualizar o import** se `accounts` não estiver no destructure do useData

Verificar se `accounts` já está sendo extraído do `useData()` em Configuracoes. Se não:

```typescript
const { owners, programs, origemTypes, accounts, addOwner, updateOwner, deleteOwner, addProgram, updateProgram, deleteProgram, addOrigemType, updateOrigemType, deleteOrigemType } = useData();
```

---

### Task 7: Atualizar Entradas — origem de pontos via Programs

**Files:**
- Modify: `src/pages/Entradas.tsx`

- [ ] **Step 1: Extrair `programs` do useData**

Já existe `programs` no destructure? Verificar linha 15. Se sim, OK. Se não, adicionar.

- [ ] **Step 2: Atualizar `currentOrigemTypes` para pontos**

Substituir a lógica que filtra `origemTypes` por `accountType`:

```typescript
const currentOrigemTypes = activeTab === "pontos"
  ? programs.filter(p => p.type === "pontos")
  : origemTypes.filter(ot => ot.accountType === "milhas");
```

- [ ] **Step 3: Atualizar display do nome no Select**

O placeholder e display precisam se adaptar:

```typescript
{currentOrigemTypes.map((item) => {
  if (activeTab === "pontos") {
    const p = item as Program;
    return (
      <SelectItem key={p.id} value={p.id}>
        {p.name}
      </SelectItem>
    );
  }
  const ot = item as OrigemType;
  return (
    <SelectItem key={ot.id} value={ot.id}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ot.color }} />
        {ot.name}
      </div>
    </SelectItem>
  );
})}
```

- [ ] **Step 4: Atualizar display na tabela de Pontos**

Na seção da tabela de Pontos, a coluna "Origem" atualmente usa `origemTypes.find(...)`. Trocar para:

```typescript
<TableCell>
  <Badge variant="outline" className="gap-1">
    {activeTab === "pontos"
      ? (programs.find(p => p.id === entry.origemTypeId)?.name ?? "-")
      : (<><div className="w-2 h-2 rounded-full" style={{ backgroundColor: origemTypes.find(ot => ot.id === entry.origemTypeId)?.color }} />{origemTypeName(entry.origemTypeId)}</>)
    }
  </Badge>
</TableCell>
```

- [ ] **Step 5: Atualizar imports** — adicionar `Program` e `OrigemType` se necessário

```typescript
import type { Program, OrigemType } from "@/types";
```

- [ ] **Step 6: Remover coluna "Taxa Conv." da tabela de Pontos** (já que a conversão será tratada depois)

Manter como está por enquanto (conforme conversa, taxa de conversão será tratada depois).

---

### Task 8: Atualizar Contas — exibir tipo do programa

**Files:**
- Modify: `src/pages/Contas.tsx`

- [ ] **Step 1: Atualizar o seletor de Programas para mostrar o tipo**

No `<SelectItem>` do programa, alterar para:

```typescript
{programs.map((program) => (
  <SelectItem key={program.id} value={program.id}>
    {program.name} ({program.type === "pontos" ? "Pontos" : "Milhas"})
  </SelectItem>
))}
```

---

### Task 9: Verificar build + lint

**Files:** N/A

- [ ] **Step 1: Rodar lint**

Run: `npm run lint`
Expected: 0 errors (apenas warnings preexistentes do shadcn/ui)

- [ ] **Step 2: Rodar build**

Run: `npm run build`
Expected: Build bem-sucedido, 0 erros
