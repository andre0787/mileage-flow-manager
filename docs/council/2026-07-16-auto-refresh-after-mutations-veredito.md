# Veredito do Council — atualização automática após inclusões

## Solicitação

Corrigir o problema transversal em que novos registros só aparecem após recalcular tudo ou limpar o cache, avaliando o código inteiro e seguindo o fluxo completo até implementação.

### Advisor: Contrarian
**Análise:** O sintoma pode não ser apenas falta de invalidação: `refetchType: 'active'`, chaves inconsistentes, filtros por usuário e atualizações locais incompletas também podem deixar telas divergentes. Corrigir somente o formulário relatado tende a repetir o defeito em entradas, vendas, programas, tipos de origem e dashboard.

A correção precisa começar por um inventário de todas as mutations e de todos os consumidores das queries afetadas. Também deve evitar invalidar consultas com chaves genéricas quando a chave real contém `userId`, e deve preservar as invariantes de saldo.

**Veredito:** Faça, mas trate como problema de fluxo de dados, não como ajuste visual isolado.

### Advisor: First Principles
**Análise:** A fonte de verdade é o Supabase; o cache do TanStack Query é uma cópia. Depois de uma mutação confirmada, toda consulta derivada ou diretamente afetada precisa ser atualizada ou invalidada de forma que refaça a leitura, inclusive quando não está montada naquele instante. O comportamento esperado é: mutation bem-sucedida → cache coerente → telas renderizam sem ação manual.

A solução mínima é centralizar/revisar a invalidação nos callbacks de sucesso, usando as chaves efetivamente declaradas e `refetchType: 'all'`, conforme a regra de estoque do projeto. Não é necessário criar um novo mecanismo global se os hooks já concentram o acesso a dados.

**Veredito:** Faça com invalidação correta e cobertura de regressão.

### Advisor: Expansionist
**Análise:** Uma auditoria transversal pode resolver de uma vez os feedbacks históricos: entradas, vendas, contas, programas, tipos de origem, clientes e dashboard. Além da query primária, saldos e métricas derivadas precisam ser atualizados para que o usuário não veja uma lista nova com saldo antigo.

A atualização otimista só deve ser usada onde já existe requisito de resposta instantânea, como tipo de origem criado dentro do formulário. Para o restante, refetch após confirmação é mais simples e confiável que duplicar regras de cálculo no cliente.

**Veredito:** Faça, cobrindo todas as mutations e seus consumidores, sem ampliar para uma refatoração geral.

### Advisor: Outsider
**Análise:** Para o usuário, “salvar” significa que a tela atual muda imediatamente. O botão de limpar cache não deve fazer parte do fluxo normal. A investigação deve procurar também mutations sem `onSuccess`, callbacks que invalidam somente uma entidade, `invalidateQueries` sem `refetchType: 'all'` e nomes de query que não coincidem.

O teste de aceitação mais valioso é inserir/editar/excluir em cada entidade e verificar que a lista, os dropdowns, os saldos e o dashboard se atualizam sem reload, recálculo ou limpeza manual.

**Veredito:** Reformule a implementação como matriz mutation → queries afetadas → tela consumidora.

### Advisor: Executor
**Análise:** O caminho viável é: levantar hooks de `src/hooks/useDatabase`, mapear `useQuery`/`queryKey`, localizar todos os `invalidateQueries` e `setQueryData`, reproduzir a lacuna, corrigir no ponto compartilhado mais baixo possível, adicionar testes estáticos/unitários para impedir regressão e executar build, testes e `pre-pr`.

Não adicionar dependência nem criar abstração até provar que as chamadas atuais não podem ser corrigidas. Se houver uma regra imutável nova, ela precisa de script; aqui a regra #19 já existe e deve ser satisfeita.

**Veredito:** Faça com a menor alteração que cubra todas as rotas.

## Peer Review

- **Contrarian sobre os demais:** concorda que `refetchType: 'all'` é necessário, mas alerta que isso não corrige uma chave de query errada; o inventário deve verificar os dois lados.
- **First Principles sobre os demais:** reforça que `onSuccess` é o momento correto para refletir apenas dados persistidos; callbacks de `onSettled` podem mascarar falhas.
- **Expansionist sobre os demais:** aceita limitar o escopo aos fluxos existentes, desde que métricas derivadas e dashboard estejam na matriz de impacto.
- **Outsider sobre os demais:** pede um teste que modele a ação do usuário sem depender de “limpar cache”, pois testes apenas de chamada do hook não garantem a experiência.
- **Executor sobre os demais:** confirma que a correção deve ser feita primeiro nas mutations compartilhadas; só alterar componentes se eles realmente omitirem a consulta correta.

## Síntese do Chairman

**Consenso:** O defeito é sistêmico: após mutations, o cache não é invalidado/refetchado de maneira completa e consistente. A causa provável inclui chamadas sem `refetchType: 'all'`, invalidação de entidades relacionadas ausente e possíveis divergências de chaves. A auditoria deve mapear mutations, query keys e telas antes de editar.

**Veredito Final:** Faça.

**Próximos Passos:**
1. Inventariar hooks, queries, mutations e consumidores.
2. Corrigir a invalidação no menor ponto compartilhado, incluindo contas e entidades derivadas.
3. Garantir atualização otimista apenas onde já é necessária.
4. Criar o menor teste de regressão possível.
5. Rodar build, testes, `npm run pre-pr`, criar PR e finalizar a sessão com handoff limpo.
