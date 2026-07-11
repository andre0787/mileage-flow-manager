# Design: Transferências, Débito de Estoque, Ciclo de Passageiros

## Data: 2026-06-21

## Resumo

Quatro mudanças independentes:

1. **Regras de transferência pontos → milhas** — reforçar validações
2. **Débito automático de milhas no estoque** ao registrar venda
3. **Remover cards de saldo por dono** na tela de Entradas
4. **Ciclo de passageiros por programa** — controle de volume de emissões

---

## 1. Transferência Pontos → Milhas (Entradas)

**O que já existe:** Fluxo de transferência funcionando com seleção de conta de pontos
origem, bonificação, validação de saldo e filtro por mesmo dono.

**Reforços:**
- Mensagem de erro clara se saldo insuficiente na conta de origem (já existe, manter)
- Mensagem de erro se conta de destino (`accountId`) e conta de origem (`sourceAccountId`) não pertencem ao mesmo dono (já existe o filtro, adicionar validação explícita com mensagem)
- Campo `amountPaid` fica **readOnly** durante transferência, preenchido automaticamente:
  `amount * sourceAvgCostPerPoint` (custo médio de aquisição da conta de origem)
- Label do campo muda para "Custo (calculado)"

**Arquivos alterados:** `src/pages/Entradas.tsx`

---

## 2. Débito de Milhas no Estoque (Vendas)

**O que muda:**
- Após `addSale()`, chamar `updateAccount(accountId, { balance: newBalance })`
  deduzindo `milesUsed` do saldo da conta
- A validação que desabilita o botão "Registrar Venda" quando
  `milesUsed > availableMiles` é mantida

**Arquivos alterados:** `src/pages/Vendas.tsx`

---

## 3. Remover Cards de Saldo por Dono (Entradas)

**O que muda:**
- Remover o grid de cards no topo da página (seção que mostra saldo de pontos e
  milhas por dono usando `owners.map`)
- Manter os demais cards (summary cards abaixo) e tabelas

**Arquivos alterados:** `src/pages/Entradas.tsx`

---

## 4. Ciclo de Passageiros por Programa

### Interface `Program` (atualizada)

```typescript
export interface Program {
  id: string
  name: string
  type: 'pontos' | 'milhas'
  maxPassengers?: number
  passengerCycleType?: 'anual' | 'dias'
  passengerCycleDays?: number     // obrigatório se cycleType === 'dias'
}
```

### Funcionamento

- Cada `passengerId` em uma venda conta como 1 slot
- Não há deduplicação por CPF — cada passageiro individual ocupa 1 slot

### Ciclo Anual

Conta passageiros de vendas do mesmo programa emitidas no **mesmo ano**
(independente do programa type, mas só relevante para milhas).

```typescript
const usedThisYear = sales
  .filter(s => s.program === program.name && new Date(s.date).getFullYear() === currentYear)
  .reduce((sum, s) => sum + s.passengers.length, 0);
```

### Ciclo por Dias

Conta passageiros de vendas do mesmo programa emitidas nos últimos N dias.

```typescript
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - program.passengerCycleDays!);

const usedInWindow = sales
  .filter(s => s.program === program.name && new Date(s.date) >= cutoff)
  .reduce((sum, s) => sum + s.passengers.length, 0);
```

### Validação na Venda

- Ao calcular se o botão "Registrar Venda" deve ficar habilitado, verificar:
  `usedInCycle + newPassengers.length <= program.maxPassengers`
- Exibir mensagem: "Limite de {N} passageiros excedido para este ciclo"

### Formulário em Configuracoes

Novos campos no dialog de Programas (após seletor de tipo):

```
Tipo de Ciclo: [Não Controlar] [Ciclo Anual] [Ciclo por Dias]
Volume Máx:    [input number]    (label: "Máx. passageiros por ciclo")
Janela (dias): [input number]    (só visível se "Ciclo por Dias")
```

- Se `passengerCycleType` for undefined/null, não há controle
- Se for "anual", `passengerCycleDays` é ignorado
- Se for "dias", `passengerCycleDays` é obrigatório (> 0)

### Tabela de Programas

Adicionar coluna "Controle" exibindo:
- "—" se sem controle
- "Anual — {N} pax/ano" se anual
- "{N} pax/{M} dias" se por dias

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/types/index.ts` | Program ganha `maxPassengers`, `passengerCycleType`, `passengerCycleDays` |
| `src/contexts/DataContext.tsx` | Mock data de programs atualizado com campos opcionais |
| `src/pages/Configuracoes.tsx` | Dialog de Programas com novos campos; tabela com coluna "Controle" |
| `src/pages/Vendas.tsx` | Validação de limite de passageiros; débito de milhas no estoque |
| `src/pages/Entradas.tsx` | Remover cards do topo; amountPaid readOnly na transferência |

---

## Não Escopo

- Deduplicação de passageiros por CPF (conta por passengerId, não por CPF)
- Histórico de ciclos pregressos (apenas vendas atuais)
- Interface para visualizar quantos slots foram usados no ciclo atual
- Exportar/importar dados
