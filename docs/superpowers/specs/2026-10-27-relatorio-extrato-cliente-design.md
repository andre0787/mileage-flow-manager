# Relatório completo do cliente — Design

## Objetivo
Na aba Relatórios > Cobrança, exibir o extrato completo de cada cliente: todos os movimentos de crédito e todas as vendas não canceladas, com o resumo financeiro do cliente e saldo final claramente identificado.

## Experiência
Cada cliente aparece em um painel expansível. O cabeçalho mantém visível o nome, total recebido/aplicado nas vendas, pendência bruta, crédito disponível e saldo final, classificado como devedor ou credor. Ao expandir, o cliente vê todos os lançamentos em uma única lista ordenada da data mais recente para a mais antiga. Vendas aparecem como débitos pelo valor integral, com recebido/aplicado e pendente discriminados; movimentos de crédito mostram tipo, observação e valor com sinal conforme seu efeito no ledger. O relatório e o CSV cobrem o histórico completo, sem corte por período, dono ou programa.

## Regra financeira
- Ignorar vendas com status `cancelado`.
- Em cada venda, `recebido/aplicado = max(0, amountReceived)` e `pendente = max(0, saleValue - amountReceived)`.
- Crédito disponível é `max(0, calcCreditBalance(movimentos))`, usando a regra já existente de `earn`, `spend` e `reversal`.
- Saldo final assinado é pendência bruta total menos crédito disponível. Positivo significa saldo devedor; negativo significa saldo credor do cliente; zero significa quitado.
- Os movimentos do ledger são mostrados como histórico separado, mas não são somados novamente às vendas no cálculo do saldo, pois aplicações de crédito podem já estar refletidas em `amountReceived`.
- Recebido é acumulado das vendas e é apresentado como valor já recebido/aplicado, sem inferir datas de recebimento que não existem nos dados.

## Ordenação e filtros
A ordenação por data é decrescente. Em empate, mantém ordem determinística por tipo e identificador. “Relatório completo” significa que o histórico de cobrança ignora os filtros de período, dono e programa da página. O painel inclui clientes que possuam ao menos uma venda ativa ou um movimento de crédito.

## Exportação e estados
O CSV exporta os mesmos lançamentos do extrato, incluindo data, tipo, descrição, débito, crédito/efeito, recebido/aplicado, pendente e o resumo de fechamento. Vazio, carregamento e erro seguem os componentes e padrões existentes.

## Escopo técnico
Reutilizar `ClientCredit`, `calcCreditBalance`, os dados já carregados pelo `DataContext` e `useAllClientCreditsQuery`. Não alterar schema, regras de recebimento, saldo de contas ou outras abas. Cobrir o agregador de relatório com os casos de venda quitada, pendente, cancelada, movimentos de crédito/reversão, cliente apenas com crédito e ordenação decrescente.
