# Design: Reformulação da Configurações e Relacionamentos

## Data: 2026-06-19

## Resumo

Reorganizar a página de Configurações e ajustar os relacionamentos entre
Donos, Programas, Contas e Tipos de Origem para refletir a semântica
correta do domínio.

## Mudanças por Entidade

### 1. Programas

**O que muda:**
- `Program` ganha campo obrigatório `type: 'pontos' | 'milhas'`
- Formulário de cadastro/edição ganha seletor de tipo

**Interface `Program` (atualizada):**
```typescript
interface Program {
  id: string
  name: string
  type: 'pontos' | 'milhas'
}
```

**Mock data (atualizado):**
```
LATAM Pass  → type: 'milhas'
Smiles      → type: 'milhas'
Livelo      → type: 'pontos'
Esfera      → type: 'pontos'
```

### 2. Donos (cadastro matriz)

**O que muda:**
- Tabela de Donos ganha coluna com contagem de contas vinculadas
- Badge numerico mostrando quantas contas (pontos + milhas) pertencem ao dono
- CRUD permanece o mesmo (nome, CPF, telefone)

### 3. Tipos de Pontos — Removido

**O que muda:**
- Aba "Tipos de Pontos" é removida da Configurações
- Dados existentes de `origemTypes` com `accountType: 'pontos'` são mantidos
  no estado para compatibilidade com entradas antigas, mas não são mais
  gerenciáveis pela UI

### 4. Tipos de Milhas → Tipo de Operação

**O que muda:**
- Aba renomeada de "Tipos de Milhas" para "Tipo de Operação"
- Conteúdo e CRUD permanecem idênticos
- Subtítulo e títulos de dialog atualizados

### 5. Preferências — Mantido

Sem alterações.

## Mudanças nas Abas (Configurações)

Ordem nova:
1. **Donos** — mesmo icone `User`
2. **Programas** — mesmo icone `Building2`
3. **Tipo de Operação** — icone `Palette`
4. **Preferências** — mesmo icone `Settings`

## Impacto em Entradas

### Aba "Pontos"
- Campo "Tipo de Origem" agora lista **Programas** com `type: 'pontos'`
- O valor selecionado é armazenado em `origemTypeId` (referencia programId)
- Display na tabela: exibe nome do programa (sem cor)

### Aba "Milhas"
- Campo "Tipo de Origem" continua listando **Tipos de Operação**
  (`origemTypes` com `accountType: 'milhas'`)
- Display na tabela: exibe nome + cor (igual hoje)

### Lógica de Display
```typescript
// No componente Entradas, para exibir a origem:
const entryAccount = accounts.find(a => a.id === entry.accountId)
const isPontosEntry = entryAccount?.type === 'pontos'

const origemNome = isPontosEntry
  ? programs.find(p => p.id === entry.origemTypeId)?.name ?? '-'
  : origemTypes.find(ot => ot.id === entry.origemTypeId)?.name ?? '-'
```

## Impacto em Contas

- Select "Programa" no formulário de Contas mostra o tipo entre parênteses:
  `"LATAM Pass (Milhas)"` / `"Livelo (Pontos)"`
- Funcionalidade inalterada — apenas display

## Impacto em Vendas

Nenhuma. Vendas só usa contas do tipo "milhas".

## Mock Data

### Programas (atualizado)
```typescript
const initialPrograms: Program[] = [
  { id: "1", name: "LATAM Pass", type: "milhas" },
  { id: "2", name: "Smiles", type: "milhas" },
  { id: "3", name: "Livelo", type: "pontos" },
  { id: "4", name: "Esfera", type: "pontos" },
]
```

### PointEntries (atualizado)
Entradas de "pontos" passam a referenciar programId em `origemTypeId`:
```typescript
const initialEntries: PointEntry[] = [
  { id: "1", accountId: "1", origemTypeId: "3", amount: 100000, ... },
  // ↑ conta "Conta Principal LATAM" é milhas, origemTypeId="3" = "Compra Direta"
  { id: "2", accountId: "2", origemTypeId: "2", amount: 80000, ... },
  // ↑ conta "Smiles Premium" é milhas, origemTypeId="2" = "Transferência"
]
```

Como as contas mock existentes são todas `type: 'milhas'`, as entries mock
não precisam mudar — continuam referenciando OrigemTypes. Quando o usuário
criar novas entradas de pontos, o `origemTypeId` passará a referenciar
programId.

## Arquivos Alterados

| Arquivo | Tipo de Mudança |
|---------|----------------|
| `src/types/index.ts` | `Program` ganha campo `type` |
| `src/contexts/DataContext.tsx` | Mock data de programs atualizado |
| `src/pages/Configuracoes.tsx` | Tabs, dialog de programas, coluna contagem donos |
| `src/pages/Entradas.tsx` | Select de origem para pontos usa programs |
| `src/pages/Contas.tsx` | Display do programa com tipo |
| `src/components/ui/badge.tsx` | Nenhuma (já tem os estilos) |
