# Council Verdict — Novas Convenções Baseadas no Code Review

**Data:** 2026-07-10
**Contexto:** Code review geral encontrou 15 issues (6 bugs, 5 gaps, 4 cleanup)

## Pergunta

"Quais novas regras de código e convenções devemos adicionar ao projeto para prevenir os tipos de bugs e sujeira que encontramos no code review? O que mudar no workflow?"

## Issues Encontrados (resumo)

1. Transfer reversal restaurava `amountPaid` em vez de custo proporcional
2. `pontosSales` sempre vazia (YAGNI não documentado)
3. `.sort()` mutava arrays memoizados
4. `window.location.href` em vez de navigate
5. `clearAccountData` não preservava tipo Transferência
6. `as any` cast desnecessário
7. `downloadCSV` duplicado em 2 páginas
8. `staleTime` redundante em 7 hooks
9. `SkeletonHero` nunca usado
10. 3 exports mortos em metrics.ts
11. 2 sistemas de serialização de description confusos

## Resumo das Respostas dos Advisors

### The Contrarian
Os bugs de dados (transfer reversal) são os mais perigosos — corrompem saldo de investimento silenciosamente. Nenhum teste capturou isso. O problema real é ausência de testes de integridade financeira. Convencões de código são inúteis sem testes que validam as invariantes.

### The First Principles Thinker
A questão não é "quais regras adicionar" mas "por que esses bugs existem?" Raiz: mutabilidade de estado (sort muta array, reversal usa valor errado). A convenção deveria ser: **toda operação financeira tem uma inversão espelhada testada**. Extrair `downloadCSV` é DRY básico, não precisa de regra — precisa de lint.

### The Expansionist
O code review revelou uma oportunidade: criar um **"audit checklist"** que roda antes de todo PR. Incluir: exports mortos, código duplicado, funções que mutam estado. Poderia ser uma skill que roda automaticamente. Também: criar um módulo `src/lib/invariants.ts` com funções de validação financeira.

### The Outsider
Não entendo por que `staleTime` precisa estar em 7 lugares se já está no global. Isso parece copy-paste de quando o global não existia. A regra deveria ser simples: "não repita config que já está no QueryClient". O.as any é pior — significa que o TypeScript não está protegendo nada.

### The Executor
Três ações concretas para segunda-feira:
1. Criar `docs/CONVENTIONS.md` → seção "Invariantes Financeiras" com as regras de reversal
2. Adicionar ESLint rule `@typescript-eslint/no-explicit-any` no projeto
3. Criar `tests/unit/invariants.test.ts` testando que reversal = operação original

## Peer Reviews

### Resposta mais forte
The First Principles — identificou a raiz real (mutabilidade de estado) e propôs a solução mais elegante (testes de inversão espelhada).

### Maior ponto cego
The Expansionist — a ideia do "audit checklist" como skill é interessante mas é over-engineering. Um shell script que roda `grep` já faz isso.

### O que TODOS perderam
Nenhum advisor mencionou que o `clearAccountData` tinha uma promessa de UI que não era cumprida. Isso é um padrão: **a UI promete algo que o código não entrega**. Deveria ter uma convenção sobre "promessas de UI".

## Veredito do Chairman

### Onde o Council Concorda
1. **Testes de integridade financeira** são a prioridade #1 — sem eles, convencões são apenas palavras
2. **`as any` deve ser eliminado** — é um bypass de segurança do TypeScript
3. **Config não deve ser duplicada** — staleTime no global = não repita nas queries

### Onde o Council Clasha
- **Novas convenções vs. mais testes**: Contrarian e First Principles dizem "testes primeiro"; Expansionist quer convenções + skills. **Resolução:** testes primeiro, convenções derivam dos testes que passam.
- **DRY enforcement**: Outsider diz "lint resolve"; Executor diz "regra no CONVENTIONS.md". **Resolução:** ambos — lint para automático, doc para conscientização.

### Blind Spots Capturados
1. **"Promessas de UI"** — quando a UI mostra algo, o backend deve garantir. Falta uma convenção sobre isso.
2. **Operações financeiras precisam de inversão espelhada** — toda mutation que altera saldo deve ter uma mutation reversa testada.

### Recomendação
Não adicionar 15 convenções novas. Adicionar **3 regras derivadas dos bugs reais** e **1 seção de invariantes financeiras**. O resto é ruído.

### A Primeira Coisa a Fazer
Criar `tests/unit/invariants.test.ts` testando que:
- reversal de transferência = operação original espelhada
- `clearAccountData` preserva Transferência
- sort não muta arrays memoizados (teste de referência)
