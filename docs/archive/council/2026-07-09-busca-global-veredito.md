# Council Verdict — Busca Global

**Data:** 2026-07-09
**Sprint:** #6 — Item 3 (Backlog)
**Pergunta:** Devemos implementar busca global no MilesControl para pesquisar em todas as entidades (entradas, vendas, clientes, contas)?

## Contexto

- MilesControl: app de gestão de milhas/pontos
- Stack: React + Vite + Supabase + Tailwind + shadcn/ui
- Dados já carregados via React Query (clientside)
- Sprint #6 tem 3 itens: offline, PDF (descartado), busca global

## Advisor Responses

### The Contrarian
Busca global é uma feature que soa útil mas raramente é usada em apps de gestão pessoal. O usuário médio tem 50-200 entradas, 20-50 vendas, 10-30 clientes. Ele já sabe onde está o que precisa. A busca já existe局部: cada página tem seu filtro. Adicionar busca global é criar uma página nova com resultados misturados que confundem mais que ajudam. Foque em algo que resolva um problema real, não uma feature que "parece bonita no roadmap".

### The First Principles Thinker
Qual é o problema real? O usuário não consegue encontrar algo? Ou ele já encontra porque navega pelas páginas? Se o problema é "demora para achar uma venda específica", a solução pode ser um filtro melhor na página de vendas, não uma busca global. Antes de construir, pergunte: quantas vezes por semana o usuário busca algo que não está na página atual? Se a resposta é "quase nunca", busque global é YAGNI.

### The Expansionist
Busca global é o gateway para inteligência no app. Hoje é busca, amanhã é "mostrar resultados relacionados", "sugestões automáticas", "dashboard personalizado baseado em busca". É uma infra que habilita N features futuras. Além disso, busca global é diferencial competitivo — a maioria dos apps de milhagem não tem. Pensem nisso não como "campo de busca" mas como "plataforma de descoberta".

### The Outsider
Eu nunca usei o app. Se eu abrisse e visse um campo de busca no topo, eu usaria para encontrar algo específico. Mas se o app já tem menus claros (Entradas, Vendas, Clientes, Contas), talvez eu nem precise. A busca global é útil quando o usuário sabe O QUE quer mas não ONDE está. Se o app é bem organizado, a busca é redundante. Se é bagunçado, a busca esconde o problema.

### The Executor
Tecnicamente é straightforward: um input no header, filtra todos os dados em memória, mostra resultados agrupados por tipo. 1-2 dias de trabalho. O难点 é UX: como mostrar resultados de tipos misturados (entrada + venda + cliente)? Opções: 1) Página separada de resultados, 2) Dropdown com seções, 3) Inline no header. A opção 2 (dropdown) é mais rápida de implementar e mais intuitiva.

## Chairman Synthesis

### Onde o Council Concorda
- Busca global é tecnicamente simples (1-2 dias)
- Dados já estão em memória (React Query)
- O problema real precisa ser validado (usuário realmente busca?)

### Onde o Council Clasha
- **Necessidade:** Contrarian e First Principles dizem que busca local já basta; Expansionist vê como plataforma para features futuras
- **Escopo:** Deve ser busca global completa ou apenas melhoria dos filtros existentes?

### Blind Spots que o Council Captou
- UX de resultados misturados (entradas + vendas + clientes)
- Validação: o usuário realmente precisa de busca global?

### A Recomendação
**Faça, mas simples.** Um input no header que filtra dados em memória e mostra dropdown com seções (Entradas, Vendas, Clientes, Contas). 1 dia de trabalho. Se o dropdown ficar bagunçado, refina depois. Não é uma plataforma — é um atalho.

### A Coisa que Você Deve Fazer Primeiro
Adicionar campo de busca no header que filtra entradas, vendas e clientes em tempo real, mostrando resultados em dropdown seccionado.

---

**Veredito:** ✅ **Faça** — busca global simples via dropdown no header (1 dia).
