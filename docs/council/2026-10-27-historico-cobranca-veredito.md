# Veredito — Histórico completo no relatório de cobrança

## Pedido
No relatório de Cobrança da aba Relatórios, exibir o histórico completo de cada cliente e um resumo acima com o recebido versus o saldo devedor.

## Advisors

### Advisor: Contrarian
**Análise:** O relatório atual só mostra vendas com pendência, então vendas já quitadas desaparecem. Exibir tudo pode tornar a lista longa; manter o histórico recolhido por cliente e a síntese sempre visível reduz esse impacto. O resumo precisa distinguir total já recebido de dívida líquida atual, sem somar crédito do cliente como dinheiro recebido.
**Veredito:** Faça, com rótulos financeiros distintos.

### Advisor: First Principles
**Análise:** O histórico é composto pelas vendas não canceladas; recebido é a soma do valor recebido em cada venda, e saldo devedor é a pendência atual após descontar créditos disponíveis do cliente. São grandezas diferentes: recebido é acumulado, devedor é saldo presente.
**Veredito:** Faça, preservando essa distinção.

### Advisor: Expansionist
**Análise:** O mesmo histórico pode apoiar a cobrança e a conferência do relacionamento com o cliente, sem criar uma nova tela ou tabela. O CSV pode acompanhar a experiência para manter exportação coerente.
**Veredito:** Faça no agrupamento existente por cliente.

### Advisor: Outsider
**Análise:** “Histórico todo” pode conflitar com o filtro de período da página. Uma seleção de período não deve ocultar vendas anteriores se a promessa for realmente histórico completo; filtros de dono/programa também podem restringir o cliente sem explicar isso.
**Veredito:** Faça apenas com escopo temporal explícito na interface e no comportamento.

### Advisor: Executor
**Análise:** `buildCollectionReport` já recebe vendas e movimentos de crédito e calcula pendências líquidas. A mudança pode estender esse agregado para incluir todas as vendas ativas, total recebido e linhas quitadas, usando os dados carregados hoje. Nenhuma alteração de schema é necessária.
**Veredito:** Faça no utilitário e na seção Cobrança.

## Peer review
Os advisors convergem que vendas quitadas devem permanecer no histórico, que vendas canceladas devem ser omitidas e que recebimentos acumulados não podem ser confundidos com crédito ou dívida atual. O filtro temporal atual exige decisão explícita para cumprir “histórico todo”.

## Síntese do Chairman
**Consenso:** Expandir o relatório por cliente para mostrar um resumo de total recebido e dívida líquida, seguido de todas as vendas não canceladas, inclusive quitadas; manter movimentos de crédito refletidos no cálculo da dívida, sem contá-los como recebimento.
**Veredito Final:** Faça.
**Próximos Passos:** Definir com a pessoa usuária se o histórico ignora o filtro de período atual; em seguida especificar comportamento e implementar.
**Extended Thinking Usado:** Sim — First Principles e Contrarian, por envolver resumo financeiro e conflito entre histórico completo e filtro temporal.

## Atualização após detalhamento solicitado (2026-10-27)
A pessoa usuária detalhou o escopo: relatório completo por cliente com todos os créditos, todas as vendas como débitos, saldo final e ordenação mais recente primeiro. O plano passa a incluir todos os movimentos de crédito e vendas não canceladas, ignora filtros da página na aba Cobrança e mostra recebido/aplicado e pendente por venda. O saldo final é pendência total menos crédito disponível; os movimentos do ledger não são contados novamente no fechamento quando sua aplicação já está em `amountReceived`.
