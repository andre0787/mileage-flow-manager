# Veredito — Playwright workers no CI

## Pergunta
Como acelerar a suíte E2E no GitHub Actions sem criar um novo problema de estabilidade?

## Veredito
**Faça o menor aumento seguro: subir o Playwright para 2 workers apenas no CI.**

### Por quê
- A suíte já é estável; o gargalo é tempo bruto.
- O CI está rodando com 1 worker por padrão, então há espaço fácil de ganho.
- Sharding e split smoke/full são mais rápidos, mas aumentam complexidade agora.
- Subir para 2 workers é o melhor custo/benefício para medir impacto real.

### Risco
- Se houver estado compartilhado escondido, o CI pode expor flakiness.
- Se isso acontecer, o próximo passo é sharding; não antes.

### Recomendação
- Configurar `workers: 2` quando `CI=true`.
- Não mudar o paralelo local por enquanto.
- Medir o tempo do pipeline antes/depois.

### Primeiro passo
- Editar `playwright.config.ts` e validar com um subset usando 2 workers.
