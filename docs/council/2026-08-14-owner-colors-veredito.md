# Veredito — Visualização por Cor dos Itens por Dono de Conta

**Tema:** Melhorar a visibilidade do usuário colorindo os itens (contas, entradas, vendas) de cada dono de conta, com cor derivada deterministicamente do nome do dono.
**Data:** 2026-08-14
**Sessão:** feature — Visualização por cor dos itens por dono de conta
**Decisão do usuário:** Escopo = Contas + Entradas + Vendas. Fonte da cor = automática por hash do nome (sem migration).

## Advisors

### Advisor: The Contrarian
**Análise:** Cor derivada por hash do nome é a abordagem de menor atrito (zero migration, zero campo novo, funciona com dados existentes), mas tem riscos: (1) cores por hash podem ter baixo contraste entre donos próximos (ex: dois donos com azuis parecidos) — mitigar com paleta fixa de alto contraste e teste de unicidade visual; (2) aplicar cor em 3 superfícies (cards, tabela de entradas, tabela de vendas) multiplica o risco de regressão visual — manter as cores como detalhe (borda/barra/chip), não como fundo inteiro, preservando a legibilidade; (3) acessibilidade: contraste texto/cor deve permanecer AA — usar cor apenas como reforço, nunca como único canal (manter o nome do dono sempre visível).
**Veredito:** Faça — com paleta fixa, cor como detalhe não-bloqueante e nome do dono sempre presente.

### Advisor: First Principles Thinker
**Análise:** O objetivo fundamental é reduzir o custo cognitivo de escanear o dashboard quando há múltiplos donos. Cor é o canal visual mais barato de processar (pré-atencional). Derivação por hash garante consistência entre sessões/páginas sem estado extra — o mesmo dono tem a mesma cor em Contas, Entradas e Vendas. Requisito técnico: função pura e testável `ownerColor(name)` com paleta curada (distância perceptiva entre cores adjacentes) + helper para derivar cores de fundo/borda com opacidade (ex: `color + "22"` para fundo 13%).
**Veredito:** Faça — lib pura `ownerColors` com hash estável + paleta de contraste.

### Advisor: The Expansionist
**Análise:** Ganhos colaterais: (1) o mesmo mecanismo pode depois estender para relatórios (Relatorios.tsx já agrupa por dono) e KPI (BusinessBreakdown por owner); (2) a lib serve de fundação para uma futura "cor configurável" — basta trocar a fonte do hash por um campo persistido; (3) a consistência entre abas reforça a marca de qualidade do app. Não inflar o escopo agora: as 3 superfícies pedidas já cobrem o fluxo principal.
**Veredito:** Faça — escopo atual (3 superfícies), deixando a lib pronta para extensão.

### Advisor: The Outsider
**Análise:** Pergunta óbvia: por que não só um filtro por dono? Resposta: o filtro já existe (ownerFilter nas 3 abas) — a cor resolve o problema *durante* a navegação sem filtro, quando o usuário precisa associar rapidamente contas/entradas/vendas ao dono. A cor complementa o filtro, não o substitui. E o nome do dono não pode sumir da célula — cor é reforço.
**Veredito:** Faça — cor como camada de reforço sobre o filtro existente.

### Advisor: The Executor
**Análise:** Viabilidade: a lib é trivial (hash + lookup em paleta fixa) com teste unitário (rule-31). As 3 aplicações são pontuais: AccountCard (borda superior ou chip de cor), Entradas (chip na célula do dono), Vendas (chip na célula do dono). 1 PR. Testes: unit da lib + ajuste nos testes de componentes existentes se necessário (Contas/Entradas/Vendas renderizam chips — checar se algum teste quebra). Nenhuma migration, nenhum campo novo, zero risco de dados.
**Veredito:** Faça — 1 PR, TDD para a lib.

### Peer Review (anônimo)
- **Reforço:** Consenso em paleta fixa de alto contraste (não `hsl(hash)` puro, que gera cores feias/duplicadas) + cor como detalhe (borda/chip) + nome sempre visível. Consenso em lib pura testável e reutilizável para relatórios/KPI no futuro.
- **Ajuste:** O Contrarian pediu checagem de contraste entre cores da paleta — garantir no teste que as cores da paleta têm distância suficiente entre si (não é preciso validação de WCAG completa, mas evitar vizinhanças confusas).

## Síntese do Chairman

**Consenso:** Implementar a visualização por cor do dono com:
1. **Lib `src/lib/ownerColors.ts`**: `ownerColor(name)` — hash determinístico (FNV-1a ou similar) sobre a paleta fixa de 12+ cores curadas (alto contraste entre si); helpers `ownerColorSoft(name)` (fundo com opacidade) e `ownerColorBorder(name)` para uso em bordas/chips. Testes unitários (rule-31): estabilidade (mesmo nome → mesma cor), distribuição (nomes distintos → cores distintas), e distância mínima entre cores da paleta.
2. **Contas (`AccountCard`)**: barra/chip de cor do dono no header do card (fonte da cor visível) + nome do dono mantido.
3. **Entradas**: chip de cor na célula do dono das entradas (aba de milhas e pontos).
4. **Vendas**: chip de cor na célula do dono.
5. Cor como **reforço** (nunca único canal) — o nome do dono permanece sempre renderizado.

**Veredito Final:** Faça — 1 PR, TDD para a lib, pre-pr ao final.

**Próximos Passos:** encaminhar para Superpowers — branch `feat/owner-colors-visual`, lib TDD, aplicar nas 3 superfícies, testes de componentes, pre-pr + PR.

**Extended Thinking Usado:** sim — Contrarian (contraste e acessibilidade) e Executor (viabilidade e escopo de teste).
