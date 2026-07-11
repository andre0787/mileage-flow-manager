# Design Specification – Correção de bugs e implementação de melhorias (AVALIAR_ITENS_BUG_E_MELHORIA_HUMANO.md)

## 1. Objetivo
Corrigir três bugs de experiência e implementar quatro melhorias de funcionalidade no módulo de registro de entradas (milhas/vendas) e transferências.

## 2. Contexto e Problemas
### 2.1 Bugs
| ID | Descrição | Descrição | Ponto de falha | Impacto |
|----|-----------|---------|
| BUG‑77 | Registro de entrada só persiste após limpeza manual do cache. | Risco de perda de dados, confusão do usuário. |
| BUG‑78 | Tipos de origem criados não aparecem nas opções de edição/exclusão nas configurações. | Impossibilidade de gerenciar tipos de origem. |
| BUG‑79 | Campo de seleção de conta de pontos fica vazio na tela de transferência envolvendo pontos. | Funcionalidade de transferência entre pontos e milhas inutilizável. |

### 2.2 Melhorias (Feature)
| ID | Descrição | Valor |
|----|-----------|-------|
| FEAT‑80a | Permitir definição de quantidade de pontos adquiridos com opção de recorrência (mensal, trimestral, semestral, anual). | Flexibilidade para lançamentos recorrentes de pontos. |
| FEAT‑80b | Permitir definição de valor pago com distribuição automática conforme recorrência. | Facilita planejamento financeiro. |
| FEAT‑80c | Adicionar campo de seleção de data inicial da recorrência. | Controle preciso do início da série. |
| FEAT‑80d | Permitir edição da data de qualquer entrada ou venda já lançada. | Correção de erros de lançamento sem excluir registro. |

## 3. Solução Proposta
### 3.1 Correções de Bugs
- **BUG‑77**: Remover a chamada desnecessária a `queryClient.clear()` antes de `window.location.reload()` em `src/contexts/DataContext.tsx`. Garantir que, após mutation de criação/atualização de entrada, a query relevante seja invalidada (`queryClient.invalidateQueries(['entries'])`) ou refetchada.
- **BUG‑78**: Na página `src/pages/Configuracoes.tsx`, garantir que o hook `useData()` (ou similar) inclua o campo `entries` (ou o nome correto que contém a lista de tipos de origem) na desestruturação e o passe como prop ao componente que renderiza a lista de tipos de origem. Também garantir que a query de tipos de origem seja refetchada após criação de novo tipo.
- **BUG‑79**: No hook que carrega a lista de contas para o select de pontos (provavelmente `src/hooks/useAccounts.ts` ou similar), aplicar filtro onde `account.type === 'points'` (ou equivalente). Garantir que o estado seja mantido após mutations de conta (criação/atualização/exclusão) invalidando a query adequada.

### 3.2 Implementação das Melhorias
Todos os novos campos serão adicionados ao formulário de “Nova Entrada” (milhas/vendas) e, quando relevante, à tela de edição.

- **Estado de formulário**: Adicionar campos `recorrência` (booleano), `recurrenceType` (enum: 'none','monthly','quarterly','semiannual','yearly'), `pointsQuantity` (number), `pointsValue` (number – valor pago), `startDate` (date). Quando `recorrence` estiver desmarcado, os campos de recorrência ficam desabilitados/invisíveis.
- **Lógica de criação**: Ao submeter o formulário, se `recorrence` true, gerar uma lista de objetos a serem criados (um por período) com base na quantidade total ou valor total dividido pelo número de períodos, usando a data de início e incrementando conforme o tipo de recorrência. Cada item será enviado via mutation de criação de entrada (ou venda) em lote ou sequencialmente, garantindo que cada lançamento receba a data apropriada.
- **Edição de data**: Na tela de edição de entrada/venda, tornar o campo de data editável (input type="date"). Ao salvar, chamar a mutation de update com a nova data. Validar regras de negócio (se houver) que impeçam alteração de dados já conciliados, caso aplicável.
- **Persistência**: O modelo de dados atual pode já suportar múltiplas entradas; se necessário, criar uma entidade de “recorrência” pai que agrupa os lançamentos gerados. Caso o schema atual seja apenas lançamentos individuais, podemos salvar cada ocorrência como entrada independente com um campo `recurrenceGroupId` para rastreamento (opcional). Isso será decidido após análise do schema (tabela `entries`).
- **Componentes reutilizáveis**: Extrair os campos de recorrência em um componente `<RecurrenceControls />` que pode ser reaproveitado em outros formulários (ex.: despesas, investimentos).
- **Testes**:
  - Unitário: cobrir o cálculo de parcelas, geração de datas, validações de formulário.
  - E2E: cobrir fluxo completo de criação de entrada recorrente, edição de data, visualização das entradas geradas, e correção dos bugs.

## 4. Impacto no Sistema
- **Frontend**: Alterações em componentes de formulário, hooks de dados, possivelmente novo componente de recorrência.
- **Backend**: Não é esperada mudança na API, exceto se for necessário adicionar endpoint para criação em lote; caso contrário, a mesma endpoint de criação será chamada múltiplas vezes.
- **Testes**: Aumento da cobertura; novos testes de unidade e E2E.
- **Documentação**: Atualizar README ou guias de uso caso necessário.

## 5. Riscos e Mitigação
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Regressão em funcionalidades existentes devido a mudanças em queries | Média | Alta | Executar suite completa de testes antes e depois; usar feature flags se necessário. |
| Complexidade na lógica de recorrência (bordas de mês/ano) | Média | Médio | Utilizar biblioteca date‑fns para manipulação de datas; escrever testes unitários de borda. |
| Sobrecarga de requisições ao criar múltiplos registros de uma vez | Baixa | Média | Limitar número máximo de parcelas (ex.: 24) e considerar paginação ou batch se necessário. |

## 6. Métricas de Sucesso
- Todos os testes unitários passam (≥90% de cobertura nas áreas modificadas).
- Todos os testes E2E passam (100%).
- Nenhum bug crítico relatado em ambiente de staging após deploy.
- Feedback positivo de usuários em testes de usabilidade (opcional).

## 7. Próximos Passos
1. Criar branch `feature/avaliar-itens-bug-e-melhoria`.
2. Implementar correções dos bugs (BUG‑77, BUG‑78, BUG‑79).
3. Implementar as funcionalidades de recorrência e edição de data (FEAT‑80a‑d).
4. Escrever testes unitários e E2E para novas funcionalidades e para garantir que os bugs não regresse.
5. Revisão de código e merge via pull request.
6. Atualizar documentação (se houver) e o HANDOFF.md.

--- 
*Este documento segue o modelo de especificação do fluxo Council‑to‑Superpowers.* 
