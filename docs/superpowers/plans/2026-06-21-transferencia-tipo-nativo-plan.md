# Transferência como Tipo de Origem Nativo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Restaurar o tipo de origem "Transferência" para entrada de milhas via conversão de pontos, como item nativo/protegido (não deletável).

**Architecture:** Três mudanças isoladas: (1) DataContext com constante ID + proteção, (2) Configuracoes oculta edição/exclusão, (3) Entradas usa ID fixo.

**Tech Stack:** React + TypeScript + shadcn/ui

---

### Task 1: DataContext — Adicionar Transferência como built-in protegido

**Files:**
- Modify: `src/contexts/DataContext.tsx`

- [ ] **Step 1: Adicionar constante TRANSFERENCIA_ID e incluir no initialOrigemTypes**

```typescript
// logo após os imports
export const TRANSFERENCIA_ID = "builtin-transferencia";

// mudar initialOrigemTypes de array vazio para:
const initialOrigemTypes: OrigemType[] = [
  { id: TRANSFERENCIA_ID, name: "Transferência", accountType: "milhas", color: "#8b5cf6" },
];
```

- [ ] **Step 2: Proteger deleteOrigemType contra exclusão da Transferência**

```typescript
const deleteOrigemType = (id: string) =>
  setOrigemTypes(prev => prev.filter(o => o.id !== id));
// mudar para:
const deleteOrigemType = (id: string) => {
  if (id === TRANSFERENCIA_ID) return; // tipo nativo, não pode ser removido
  setOrigemTypes(prev => prev.filter(o => o.id !== id));
};
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 2: Configuracoes — Ocultar Transferência da lista editável

**Files:**
- Modify: `src/pages/Configuracoes.tsx`

- [ ] **Step 1: Importar TRANSFERENCIA_ID e filtrar tipos editáveis**

```typescript
// adicionar ao import existente do DataContext
import { useData, TRANSFERENCIA_ID } from "@/contexts/DataContext";

// mudar a linha que define milhasTypes:
const milhasTypes = origemTypes.filter(ot => ot.accountType === "milhas");
// para:
const milhasTypes = origemTypes.filter(ot => ot.accountType === "milhas" && ot.id !== TRANSFERENCIA_ID);
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 3: Entradas — Usar ID fixo em vez de nome para detectar transferência

**Files:**
- Modify: `src/pages/Entradas.tsx`

- [ ] **Step 1: Importar TRANSFERENCIA_ID e mudar detecção**

```typescript
// adicionar ao import
import { useData, TRANSFERENCIA_ID } from "@/contexts/DataContext";

// mudar de:
const isTransfer = selectedOrigemType?.name === "Transferência";
// para:
const isTransfer = selectedOrigemType?.id === TRANSFERENCIA_ID;
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 4: Validação final — smoke test manual

- [ ] **Step 1: Iniciar dev server e testar fluxo completo**

Run: `npm run dev`

Testar:
1. Abrir Configuracoes > Tipo de Operação — "Transferência" não deve aparecer na lista
2. Abrir Entradas > aba Milhas > Nova Entrada — "Transferência" deve aparecer no select
3. Selecionar "Transferência" — campos de conta origem e bônus devem aparecer
4. Preencher e registrar — deve funcionar normalmente
