# Veredito do Council — Refino Controle de CPF (passageiros, filtro global, duplicados)

**Data:** 2026-09-07 · **Categoria:** feature · **Página:** `src/pages/ControleCPF.tsx` + `src/hooks/useClientCycleAvailability.ts`

## Diagnóstico (First Principles + Outsider)

- O hook já agrega no grão correto (`programa|dono`, com `limit/used/percentage/cycleLabel` e
  dedupe de pessoas por `clientId||cpf` no ciclo vigente). A página **desperdiça** isso:
  recomputa `usageByProgram` só por programa, sem dono.
- Cards, resumos e alerta crítico usam dados **não filtrados**; só a tabela respeita o filtro do topo.
- Unidade de contagem exibida é "clientes"; o correto é **passageiros** (clientes vivem em outra aba).
- Lógica `flatMap` da tabela duplicada entre desktop/mobile (violação DRY, cf. rule-15).
- Título diz "Controle de Clientes por Programa" numa aba de CPF.

### Advisor: Contrarian — **Faça (com escopo travado)**
Riscos: mudar a semântica de contagem altera números que o usuário já usa; renomear
"clientes"→"passageiros" mexe no modelo mental; sinal de duplicados pode confundir se
poluir o limite. Trava: duplicado **nunca** altera contagem, só sinaliza; nada fora da página.

### Advisor: First Principles — **Faça**
Fundamento: limite = pessoas distintas por programa+dono por ciclo (`maxPassengers`).
Correção = usar o grão do hook + filtro global + pessoa única + sinal de duplicado.

### Advisor: Expansionist — **Faça**
Ganhos: reaproveitar `limit/used/percentage` do hook elimina ~60 linhas de recomputação;
sinal de CPF reutilizado entre emissões tem valor operacional real (fraude/erro).

### Advisor: Outsider — **Faça**
Perguntas óbvias: por que a página recomputa o que o hook retorna? Por que colunas
`hidden md:table-cell` + lista mobile duplicada em vez de um modelo de linha compartilhado?

### Advisor: Executor — **Faça**
Esforço médio, 1 página + 1 helper em `src/lib` + testes. Riscos: `sale.passengers`
opcional; estados vazios; gate Optimizer (página tem 399 linhas > 150 — **fatiar em
componentes ≤150 linhas**); rule-31 (toda lib nova tem teste unitário).

## Peer Review
Consenso em **Faça**; trava de escopo do Contrarian e helper DRY do Outsider incorporados.

## Síntese do Chairman
**Consenso:** Faça. **Veredito Final:** Faça. **Extended Thinking:** não (sem trade-off
complexo; semântica decidida pelo usuário).

## Spec de implementação (para Superpowers)
1. **Cards:** um por entrada `programa|dono` do hook (reusar `limit/used/percentage/cycleLabel`).
2. **Filtro global:** programa+dono do topo valem para cards, resumos, tabela e alerta crítico.
3. **Unidade = passageiro** (`clientId||cpf`); trocar strings "clientes"→"passageiros" nas contagens;
   título → "Controle de Passageiros por Programa".
4. **Duplicados:** helper puro em `src/lib/passengerDuplicates.ts` — passageiro (mesmo id) em
   **>1 emissão** (venda) no ciclo vigente e dentro do filtro: lista/sinaliza (nome, CPF,
   onde aparece), **sem** contar no limite; total global conta cada pessoa 1×.
   Não duplicar lógica de ciclo: mover `isInCurrentCycle`/`getCycleLabel` para `src/lib`
   (com teste unitário) e importar no hook.
5. **Tabela:** extrair modelo de linha compartilhado desktop/mobile; badge "N emissões" no duplicado.
6. **Resumos:** Total de Passageiros Únicos (filtrado), Programas em Alerta (filtrado),
   Situação Crítica (filtrada).
7. **Testes:** unit do helper + ciclo; verificar/atualizar testes da página em `tests/`.

## INTENT
INTENT: código faz contagem de clientIds únicos por programa (sem dono, sem filtro nos cards);
task espera cards por dono+programa, tudo filtrado, contagem de passageiros com sinal de
duplicados entre emissões; usuário declarou exatamente isso ("manda bala" no escopo acima).
Alinhado — pode implementar.
