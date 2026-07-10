# Council Verdict — Modo Offline com Sincronização

**Data:** 2026-07-09
**Sprint:** #6 — Item 1 (Backlog)
**Pergunta:** Devemos implementar modo offline com sincronização automática no MilesControl?

## Contexto

- MilesControl: app React + Vite + Supabase para gestão de milhas/pontos
- Dados: entradas, vendas, clientes, contas — carregados via React Query + Supabase
- Stack: React, Vite, Supabase (PostgreSQL + Auth), Tailwind, shadcn/ui
- Deploy: Vercel (auto-deploy)
- Problema: sem conexão = app inutilizável

## Advisor Responses

### The Contrarian
Modo offline com Supabase é um pesadelo não documentado. O Supabase client não tem suporte nativo a offline — você precisa de: 1) Service Worker para cachear assets, 2) IndexedDB para dados, 3) Fila de mutações para sync, 4) Conflict resolution (last-write-wins? merge?). Isso não é "modo offline", é um database replicado. Cada uma dessas peças é um projeto de 1-2 semanas. O usuário real do MilesControl (agente de viagem) está sempre online — escritório, celular, Wi-Fi. Quando ele estaria offline? Avião? Então ele não precisa de dados em tempo real. Não façam isso.

### The First Principles Thinker
Qual é o problema real? "App não funciona sem internet." Mas quantas vezes o usuário está sem internet? Se é 1% do tempo, a solução não é reconstruir o app — é mostrar uma mensagem amigável: "Sem conexão. Os dados são sincronizados quando voltar online." Solução: 1) Cache de leitura no localStorage (já temos React Query), 2) Mensagem offline amigável, 3) Retry automático quando voltar. Isso resolve 95% do caso de uso com 5% do esforço. O resto (offline completo com mutações) é YAGNI até ter dados que proveam necessidade.

### The Expansionist
Modo offline é o que separa um app amador de um app profissional. Agentes de viagem trabalham em trânsito, aeroportos,Hotels. Offline não é edge case — é cenário real. E com Supabase + Realtime, já temos a infra para sync. O Supabase Local Storage (experimental) ou o PowerSync podem resolver isso. Não reinventem a roda. Usem uma lib existente. E offline habilita: 1) PWA installable, 2) Notificações push, 3) Background sync. É uma plataforma, não uma feature.

### The Outsider
Eu nunca usei um app de milhagem offline. Mas já usei apps de viagem offline (maps, boarding passes). O que importa: ver os dados que já tenho, não criar dados novos. Se eu estiver no avião, quero ver minhas milhas, não cadastrar uma venda. A venda eu faço quando voltar. Então: offline = leitura. Online = escrita + sync. Isso simplifica 10x a implementação. Não precisam de fila de mutações — bloqueiam a escrita offline e sincronizam quando voltar.

### The Executor
Tecnicamente, o caminho mais curto:
1. Service Worker (Workbox) para cachear assets e API responses
2. React Query staleTime + cacheTime já mantém dados em memória
3. IndexedDB (via Dexie.js) para persistir dados entre sessões
4. Hook `useOnlineStatus()` que detecta conexão
5. Quando offline: desabilita botões de criação/edição, mostra banner
6. Quando volta online: refetch automático via React Query

Isso é 80% do valor com 20% do esforço. Mutação offline (criar/editar offline e sync depois) é outro projeto — façam isso só se dados provarem necessidade.

## Chairman Synthesis

### Onde o Council Concorda
- Offline completo (mutações offline + sync) é complexo demais para 1 sprint
- A maioria dos usuários está online 95%+ do tempo
- Solução de leitura (cache + mensagem amigável) resolve o caso real

### Onde o Council Clasha
- **Escopo:** Contrarian quer nada; Expansionist quer PWA completa; First Principles e Executor querem solução minimal; Outsider quer leitura-only
- **Tecnologia:** Supabase não tem suporte offline nativo — libs externas (PowerSync, LocalSync) são experimentais

### A Recomendação
**Faça o mínimo que resolve o problema real:**
1. Service Worker para cache de assets (Workbox, 1 dia)
2. Hook `useOnlineStatus()` com banner "Sem conexão"
3. Desabilitar botões de criação/edição quando offline
4. React Query já mantém cache em memória
5. Refetch automático quando voltar online

**Não faça:** IndexedDB, fila de mutações, conflict resolution, sync offline. São projetos separados que precisam de validação com dados reais.

### A Coisa que Você Deve Fazer Primeiro
Service Worker com Workbox para cachear assets estáticos e API responses do Supabase. Isso sozinho melhora a experiência offline em 80%.

---

**Veredito:** ✅ **Faça** — Solução minimal (cache + banner + botões desabilitados). 2-3 dias. Não faça mutações offline.
