# Plano de Execução – Correção de bugs e implementação de melhorias (AVALIAR_ITENS_BUG_E_MELHORIA_HUMANO.md)

## Objetivo
Corrigir os três bugs (BUG‑77, BUG‑78, BUG‑79) e implementar as quatro melhorias (FEAT‑80a‑d) conforme especificado no design.

## Estratégia
- Trabalhar em uma branch feature/avaliar-itens-bug-e-melhoria.
- Dividir o trabalho em duas fases:
  1. **Fase 1 – Correção de bugs** (prioridade alta, objetivo: tornar o sistema estável).
  2. **Fase 2 – Implementação de melhorias** (prioridade média, agregar valor).
- Cada fase inclui: análise, implementação, testes unitários, testes E2E, revisão de código.
- Após cada fase, realizar merge via PR e atualizar o HANDOFF.md.

## Tarefas

### Fase 1 – Correção de Bugs
| ID | Descrição | Estimativa | Responsável | Status |
|----|-----------|------------|-------------|--------|
| B1 | Remover `queryClient.clear()` em `DataContext.tsx` e garantir invalidation adequada após criação/atualização de entrada. | 1h | Desenvolvedor A | ☐ |
| B2 | Ajustar `useData()` em `Configuracoes.tsx` para incluir `entries` e passar ao componente de lista de tipos de origem. | 1h | Desenvolvedor A | ☐ |
| B3 | Corrigir filtro de contas de pontos no hook de contas (ex.: `useAccounts`) para trazer apenas contas do tipo pontos. | 1h | Desenvolvedor B | ☐ |
| B4 | Escrever/atualizar testes unitários para cada correção (mocks de queryClient, hooks). | 1h | Desenvolvedor A/B | ☐ |
| B5 | Escrever/cenários E2E para validar: <br>‑ Registro de entrada aparece sem limpar cache.<br>‑ Tipo de origem criado aparece na lista de edição.<br>‑ Seleção de conta de pontos preenchida na transferência. | 2h | QA (ou desenvolvedor) | ☐ |
| B6 | Revisão de código e pull request. | 0.5h | Líder de equipe | ☐ |
| B7 | Merge na branch `main` e deploy em staging. | 0.5h | DevOps | ☐ |
| B8 | Verificar pós‑deploy: testes de smoke e verificação visual. | 0.5h | QA | ☐ |

### Fase 2 – Implementação de Melhorias
| ID | Descrição | Estimativa | Responsável | Status |
|----|-----------|------------|-------------|--------|
| F1 | Criar componente reutilizável `RecurrenceControls` (toggle, tipo, quantidade, valor, data inicial). | 2h | Desenvolvedor C | ☐ |
| F2 | Integrar `RecurrenceControls` ao formulário de Nova Entrada (milhas/vendas) e ao formulário de edição. | 1.5h | Desenvolvedor C | ☐ |
| F3 | Implementar lógica de geração de múltiplos lançamentos baseado na recorrência (utilizando date‑fns). | 2h | Desenvolvedor D | ☐ |
| F4 | Garantir que a mutation de criação lote ou sequencial respeite o loading e error states. | 1h | Desenvolvedor D | ☐ |
| F5 | Implementar edição de data em tela de edição (input type="date", chamada de mutation update). | 1h | Desenvolvedor C | ☐ |
| F6 | Escrever testes unitários: <br>‑ cálculo de parcelas e datas.<br>‑ validações do formulário.<br>‑ comportamento do `RecurrenceControls`. | 2h | Desenvolvedor C/D | ☐ |
| F7 | Escrever cenários E2E: <br>‑ Criar entrada recorrente e verificar lançamentos gerados.<br>‑ Editar data de entrada existente.<br>‑ Testar combinação com campos de valor/pontos. | 3h | QA | ☐ |
| F8 | Revisão de código e pull request. | 0.5h | Líder de equipe | ☐ |
| F9 | Merge na branch `main` e deploy em staging. | 0.5h | DevOps | ☐ |
| F10 | Verificar pós‑deploy: testes de smoke e validação de funcionalidades. | 0.5h | QA | ☐ |

## Cronograma Sugerido (dias úteis)
- **Dia 1**: Fase 1 – Tarefas B1–B3 (análise e iniciais correções)
- **Dia 2**: Fase 1 – B4–B5 (testes) e B6 (revisão)
- **Dia 3**: Fase 1 – B7–B8 (deploy e verificação)
- **Dia 4**: Fase 2 – F1–F3 (componentes e lógica)
- **Dia 5**: Fase 2 – F4–F5 (integração e edição de data)
- **Dia 6**: Fase 2 – F6 (testes unitários)
- **Dia 7**: Fase 2 – F7 (testes E2E) e F8 (revisão)
- **Dia 8**: Fase 2 – F9–F10 (merge, deploy, verificação)

## Métricas de Acompanhamento
- Burndown de tarefas (quadro Kanban).
- Cobertura de código (target >80% nas áreas modificadas).
- Número de bugs regressão encontrados pós‑release (alvo: 0).

## Definition of Done (DoD)
- Código revisado e aprovado em pull request.
- Todos os testes unitários e E2E passam no CI.
- Documentação atualizada (se necessário).
- Release notes adicionadas ao CHANGELOG.md.
- Registro no HANDOFF.md com referência ao PR e resumo das mudanças.

## Riscos e Contingências
| Risco | Probabilidade | Impacto | Plano de Contingência |
|-------|---------------|---------|-----------------------|
| Dependência externa (date‑fns) introduz bug de fuso horário | Baixa | Médio | Testes com diferentes timezones; usar UTC internamente. |
| Escopo das melhorias aumenta durante implementação | Média | Alta | Manter foco no MVP definido; adiçar extensões para futuro backlog. |
| Falha no pipeline de CI devido a novos testes | Média | Médio | Revisar configuração de cache e paralelismo; executar localmente antes de push. |

## Aprovação
Este plano será revisado e aprovado pelo Tech Lead antes do início das atividades.

--- 
*Plano elaborado seguindo o framework Council‑to‑Superpowers.* 
