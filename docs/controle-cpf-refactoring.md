# Refatoração ControleCPF → Controle de Clientes por Ciclo

## Problema
A página ControleCPF usa dados mockados, sem conexão com o DataContext. O controle deve refletir o uso real de passageiros (`id_cliente`) por ciclo, programa e dono.

## Solução
Criar hook `useClientCycleAvailability` e refatorar a página para consumi-lo.

## Hook: `useClientCycleAvailability`
**Arquivo:** `src/hooks/useClientCycleAvailability.ts`

### Input
- `sales: Sale[]` (do DataContext)
- `programs: Program[]` (do DataContext)

### Output
```typescript
{
  usage: ProgramOwnerUsage[]
  programs: string[]   // unique program names for filter
  owners: string[]     // unique owner names for filter
}

interface ProgramOwnerUsage {
  program: string
  owner: string
  cycleLabel: string      // e.g. "2026" or "Últimos 180 dias"
  limit: number           // maxPassengers do programa
  used: number            // unique clientIds count
  available: number       // limit - used
  percentage: number      // (used/limit)*100
  clients: ClientUsage[]  // unique clients consuming slots
}

interface ClientUsage {
  clientId: string
  name: string
  cpf: string
  lastSaleDate: string
}
```

### Regras de Cômputo
1. Identificador único do passageiro: `clientId` (se existir) → fallback `cpf`
2. Ciclo anual (`passengerCycleType === 'anual'`): agrupa por ano da venda
3. Ciclo dias (`passengerCycleType === 'dias'`): rolling window de N dias
4. Programas sem `maxPassengers` são incluídos sem limite (ilimitados)
5. Vendas sem passageiros são ignoradas

## Página: ControleCPF.tsx
### Mudanças
- Remove todos os dados mockados (`programLimits`, `cpfUsages`, `years`)
- Conecta ao DataContext via `useData()`
- Usa `useClientCycleAvailability` para computar dados
- Filtros: Programa + Dono (remove filtro de ano fixo, usa ciclo do programa)
- Cards no topo: data-driven por programa (total agregado)
- Tabela detalhada: lista clientes únicos consumindo vagas no ciclo atual
- Ordenação: percentual decrescente (mais críticos primeiro)

### Layout
```
[Header]
[Filter: Programa ▼ | Dono ▼]
[Summary Cards: Total Clientes Únicos | Programas em Alerta | Situação Crítica]
[Program Cards: por programa, mostrando used/limit]
[Detail Table: Cliente | CPF | Dono | Programa | Último Uso | Ciclo]
[Alert Section: programas >90%]
```

## Arquivos Alterados
| Arquivo | Tipo |
|---------|------|
| `src/hooks/useClientCycleAvailability.ts` | Novo |
| `src/pages/ControleCPF.tsx` | Alterado |

## O que NÃO Muda
- `DataContext.tsx` — intacto
- `Vendas.tsx` — intacto
- `Clientes.tsx` — intacto
- `types/index.ts` — intacto
- Rotas, navegação — intactas
- Demais hooks, páginas, componentes — intactos
