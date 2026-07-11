# Council Verdict: Priorização do Backlog Restante

**Data:** 2026-07-09
**Pergunta:** Dos itens restantes no backlog, qual devemos implementar agora?

## Itens Restantes no Backlog

1. **Notificações push para confirmação de entradas** — Alertar usuário quando entrada precisa de confirmação
2. **Multi-idioma (i18n)** — Suporte a múltiplos idiomas (pt-BR, en-US, etc.)
3. **Code splitting (recharts 163kB — lazy load)** — Dividir bundle para melhorar performance

## Contexto

- App: MilesControl — gestão de milhas/pontos
- Stack: React + Vite + Supabase + Tailwind + shadcn/ui
- Status atual: 33 testes unitários, 8 E2E, deploy automático Vercel
- Bundle atual: ~1MB (recharts é 163kB sozinho)
- Público: usuários individuais no Brasil (pt-BR)

---

## Fase 1: Respostas dos Advisors

### The Contrarian

**Notificações push:** Requer service worker, permissão do usuário, backend de notificações. complexidade alta para benefício incerto. Usuários de gestão de milhas não precisam ser lembrados de usar o app - eles usam quando têm transações.

**i18n:** Nenhum dos seus usuários atuais precisa de inglês. São todos brasileiros. Adicionar i18n agora é over-engineering. Quando você tiver usuários internacionais, aí sim.

**Code splitting:** Único item que resolve um problema real. recharts pesa 163kB e só é usado em uma página. Lazy loading melhora performance para todos os usuários, não apenas para um subconjunto.

### The First Principles Thinker

**O que você está resolvendo?**

- **Notificações:** "Usuário esquece de confirmar entrada" → Solução: email reminder (mais simples que push)
- **i18n:** "Usuário não fala pt-BR" → Não é seu público atual
- **Code splitting:** "App carrega lento" → Problema real que afeta todos

**Prioridade deveria ser:** Code splitting > Notificações (via email) > i18n

### The Expansionist

**Notificações:** Oportunidade de engajamento. Push notifications aumentam retenção em 30-40%. Pode ser diferencial competitivo.

**i18n:** Mercado global de gestão de milhas é enorme. Português é limitante. i18n abre mercado.

**Code splitting:** Melhoria de performance é invisível para o usuário. Não gera engagement. É importante mas não vende.

**Recomendação:** Notificações push (maior ROI em engajamento)

### The Outsider

**Notificações push:** Não sei se eu queria receber notificação no celular sobre pontos de fidelidade. Parece spam. Email é menos intrusivo.

**i18n:** Se o app é para brasileiros, por que precisa de inglês? Não faz sentido.

**Code splitting:** Não sei o que é "code splitting". Se melhora a velocidade, ótimo. Mas não entendo por que isso é prioridade.

**Recomendação:** Não sei. Talvez email seja melhor que push.

### The Executor

**Notificações push:** 2-3 semanas: service worker, backend, permissões, UI. Complexo.

**i18n:** 2-4 semanas: refatorar todas as strings, criar sistema de tradução, manter sincronizado. Trabalho enorme.

**Code splitting:** 2-3 dias: lazy load recharts, testar, verificar se funciona. Simples.

**Recomendação:** Code splitting. Menor esforço, benefício imediato para todos.

---

## Fase 2: Peer Reviews (Anonimizados)

### Review A (Response C - Expansionist)

**Mais forte:** Expansionist vê oportunidade de engajamento com notificações. O argumento de retenção é válido.

**Maior cego:** Assume que push notifications são bem-vindas. Muitos usuários consideram spam e desinstalam.

**Todos missaram:** Nenhum mencionou que notificações push requerem permissão do usuário (prompt) e a maioria recusa.

### Review B (Response A - Contrarian)

**Mais forte:** Contrarian identifica que code splitting é o único item que resolve um problema real para todos os usuários.

**Maior cego:** Assume que i18n não é necessário. Pode haver usuários lusófonos (Angola, Moçambique) que não são "internacionais" mas precisam de outros idiomas.

**Todos missaram:** Nenhum mencionou que code splitting pode ser feito incrementalmente (só recharts primeiro).

### Review C (Response B - First Principles)

**Mais forte:** First Principles foca no problema real vs solução. Isso é crucial.

**Maior cego:** Assume que email resolve notificações. Mas email tem taxa de abertura de 20%, push tem 60%.

**Todos missaram:** Nenhum mencionou que pode haver métricas de uso que mostram onde o app é lento.

### Review D (Response D - Outsider)

**Mais forte:** Outsider questiona se notificações são desejadas. Isso é importante - não Assumes features.

**Maior cego:** Não entende que code splitting melhora experiência mobile (onde internet é mais lenta).

**Todos missaram:** Nenhum mencionou que pode testar com usuários reais antes de implementar qualquer coisa.

### Review E (Response E - Executor)

**Mais forte:** Executor foca no custo de implementação. Code splitting é claramente o mais barato.

**Maior cego:** Assume que 2-3 dias é suficiente. Pode haver edge cases com recharts lazy loading.

**Todos missaram:** Nenhum mencionou que pode medir impacto real antes/depois com Lighthouse.

---

## Síntese do Chairman

### Onde o Council Concorda

1. **Code splitting é o mais simples** - Todos concordam que é menor esforço
2. **i18n é o mais complexo** - Todos concordam que é trabalho enorme
3. **Notificações têm valor** - Mas complexidade é moderada-alta

### Onde o Council Discorda

1. **Prioridade:** Expansionist quer notificações (engajamento), Contrarian e Executor querem code splitting (performance)
2. **Abordamento de notificações:** Push vs email
3. **Necessidade de i18n:** Agora vs futuro

### Blind Spots que o Council Capturou

1. **Code splitting incremental:** Pode começar só com recharts
2. **Métricas:** Medir performance antes/depois
3. **Notificações via email:** Alternativa mais simples que push
4. **Validação:** Testar com usuários reais

### Recomendação

**Implementar Code Splitting agora.** É a única feature que:
- Resolve um problema real para TODOS os usuários (performance)
- Tem menor esforço (2-3 dias)
- Não introduz complexidade significativa
- Pode ser medida objetivamente (Lighthouse, FCP, LCP)

**Notificações:** Implementar via email primeiro (mais simples), push depois se houver demanda.

**i18n:** Deixar para quando houver usuários internacionais.

### A Coisa que Deve Ser Feita Primeiro

**Code splitting de recharts:**
1. Lazy load só quando usuário acessa Dashboard/Relatórios
2. Medir bundle size antes/depois
3. Testar em mobile (onde impacto é maior)
4. Documentar ganho de performance

---

## Veredito Final: **FAÇA CODE SPLITTING**

Razão: É a feature com melhor custo-benefício. Resolve problema real para todos os usuários, menor esforço de implementação, e pode ser medida objetivamente. Notificações e i18n são importantes mas complexas demais para o estágio atual.
