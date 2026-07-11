# Veredito do Council – Avaliação de bugs e melhorias (AVALIAR_ITENS_BUG_E_MELHORIA_HUMANO.md)

## Contexto
Foram listados 3 bugs de experiência e 4 melhorias de funcionalidade no fluxo de “Registrar nova entrada”. Os bugs impedem o funcionamento correto do sistema (cache, tipos de origem, seleção de contas de pontos). As melhorias visam acrescentar recorrência, distribuição de valores e edição de data.

## Decisão do Council
1. **Prioridade Alta (Sprint corrente)** – Corrigir os três bugs identificados:
   - BUG: Registro de entrada só salva após limpar cache
   - BUG: Tipos de origem não aparecem na edição/exclusão
   - BUG: Seleção de conta de pontos vazia na transferência

2. **Prioridade Média (Próxima Sprint)** – Implementar as quatro melhorias solicitadas:
   - FEATURE: Quantidade de pontos adquiridos com recorrência (mensal/trimestral/semestral/anual)
   - FEATURE: Valor pago com distribuição por recorrência
   - FEATURE: Seleção de data da recorrência
   - FEATURE: Editar data de qualquer entrada ou venda

3. **Métricas de sucesso**
   - Todos os testes unitários e E2E devem passar após as correções.
   - Nenhum novo bug introduzido (verificado via revisão de código e testes de regressão).
   - As novas funcionalidades devem ser cobertas por testes unitários e E2E.

4. **Observações**
   - Os bugs estão relacionados a inconsistências de state e queries do React Query; a correção deve seguir as padrões estabelecidos em `src/lib/supabase.ts` e os hooks de dados.
   - As melhorias devem ser implementadas de forma modular, reutilizando componentes existentes (ex.: formulários de recorrência) e seguindo o padrão de acesso a dados via React Query.

**Aprovação unânime do Council.**
