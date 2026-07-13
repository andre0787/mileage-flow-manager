# Council Verdict: Plano de Automação & Sprints

**Data:** 2026-07-10
**Trigger:** Varredura de 48 arquivos .md — 29 órfãos, 9 gaps de automação, 5 promessas quebradas

## Framed Question

Com base na varredura completa de 48 arquivos .md do projeto MilesControl, qual a melhor estratégia para priorizar e executar a correção de todos os gaps identificados, organizando em sprints, seguindo boas práticas de mercado?

### Fatores de Contexto
- Projeto em produção (Vercel), 107 testes passando (40 unitários + 67 E2E)
- Deploy manual via `vercel --prod` — sem CI/CD
- 3 harnesses: pi (principal), OpenCode (secundário), Claude Code (terciário)
- Skills ativas: council-to-superpowers, handoff, ponytail, caveman
- 29 arquivos órfãos sem referências cruzadas
- develop 89 commits atrás de main

## Where the Council Agrees

1. **CI/CD é a prioridade máxima.** 107 testes que não rodam automaticamente é o maior desperdício. CI pipeline desbloqueia tudo.
2. **develop 89 commits atrás precisa ser resolvido HOJE.** Custo zero, remove confusão.
3. **29 órfãos são ruído, não risco.** Arquivar em lote é suficiente — catalogar um por um é over-engineering.
4. **Pre-push hook local não vale o esforço.** Hooks manuais são ignorados (--no-verify). CI-based verification é o caminho.

## Where the Council Clashes

**Automação total vs. gradual:**
- Contrarian: automatizar tudo de uma vez é arriscado, pode criar CI frágil
- Executor: 3 horas resolve 7/9 gaps
- **Chairman: meio termo.** CI/deploy agora, arquivar órfãos em lote, catalogação fina só quando necessário.

**Cross-harness:**
- Outsider: configurar 3 harnesses é desperdício se só pi é usado
- Expansionist: multi-harness é diferencial
- **Chairman: barato de fazer (5 min cada), não priorizar mas fazer.**

## Blind Spots Caught

1. Ninguém questionou qual harness é usado de fato (Outsider)
2. Ninguém mencionou docs/handoff.md — CI/CD muda o fluxo de handoff
3. Ninguém considerou custo de manter CI/CD — usar continue-on-error em fases não-críticas

## The Recommendation

**Sim, executar em 3 sprints focados:**

1. **Sprint A — Fundação de Automação:** CI/CD, deploy automático, matar develop, scripts package.json
2. **Sprint B — Limpeza & Confiabilidade:** Arquivar 29 órfãos, scripts de verificação, cross-harness config
3. **Sprint C — Polimento & Prevenção:** Script de varredura automática no CI, dashboard de qualidade, docs atualizados

## The One Thing to Do First

**Criar `.github/workflows/ci.yml` com `npm ci → npm run build → npx playwright test`.** Isso resolve 3 gaps (bateria pré-deploy, testes E2E automáticos, CI/CD) e qualquer outro passo fica mais seguro com CI rodando.

---

## Advisor Responses

### The Contrarian
Vai quebrar tudo se tentar automatizar de uma vez. Nove gaps. Vinte e nove órfãos. O erro clássico: gastar 3 sprints "arrumando a casa" enquanto zero features novas chegam em produção. CI/CD quebrado é pior que ausente — se o GitHub Actions falhar por timeout e ninguém souber consertar, o time todo fica bloqueado. Pre-push hook vai ser ignorado com --no-verify na primeira semana. Arquivar 29 órfãos um por um é trabalho braçal sem retorno.

### The First Principles Thinker
O problema real: o projeto atingiu tamanho onde o custo de onboard é alto demais. Cada sessão começa lendo 4+ docs. A varredura existe porque ninguém consegue manter coerência manualmente. Solução: 1) CI que reporta sem bloquear, 2) Hierarquia clara de docs, 3) Pipeline de deploy automatizado. Pergunta certa: "Qual gap custa mais caro hoje?" Resposta: deploy manual + zero CI.

### The Expansionist
29 órfãos é um museu de 3 meses de evolução. Oportunidade: 1) Pipeline CI/CD completo vira case de estudo, 2) Docs podem virar wiki viva com INDEX.md automático, 3) Cross-harness integration é raro e diferencia o projeto, 4) GitHub Actions templates reutilizáveis. Upside: criar ecossistema que qualquer agente entende em 5 minutos.

### The Outsider
107 testes passando mas ZERO roda automaticamente — isso é loucura. Relatório HTML obrigatório sem ferramentas é regra que ninguém segue. develop 89 commits atrás é tumor digital. Três harnesses com config parcial é complexidade desnecessária. O que todos perderam: ninguém perguntou qual harness é usado DE FATO.

### The Executor
Passo 1 (hoje): matar develop. Passo 2 (hoje): test:e2e no package.json. Passo 3 (amanhã): .github/workflows/ci.yml. Passo 4 (amanhã): .github/workflows/deploy.yml. Passo 5 (essa semana): script de varredura automática. Passo 6 (essa semana): arquivar 29 órfãos em lote. Total: ~3 horas, 7/9 gaps resolvidos.

## Peer Reviews

- **Response mais forte:** B (First Principles) — identificou o problema real (custo de onboard) em vez dos sintomas (falta de CI)
- **Maior blind spot:** D (Outsider) — o ponto sobre qual harness é usado de fato passou batido por todos os outros
- **O que todos perderam:** docs/handoff.md — CI/CD muda o workflow de handoff. Ninguém considerou onde entram os council verdicts no pipeline automatizado
