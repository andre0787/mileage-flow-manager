# Veredito — Council: Incluir relatório ilustrativo do workflow como aba no webapp

> **Data:** 2026-08-08
> **Sessão:** feature — adaptar `docs/workflow-demo/workflow-illustrated.html` (56KB standalone) para uma aba/página React no MilesControl
> **Topico:** feature/UI — portar relatório educacional do workflow (gates + telemetria) para o app com adaptação de design mantendo a estrutura
> **Modelo dos advisors:** opencode/deepseek-v4-flash-free (rota llm:route, capability review, retrySafety read-only)

---

## Solicitação

Incluir o relatório ilustrativo educacional do workflow (construído em `docs/workflow-demo/workflow-illustrated.html`, HTML standalone CSS+JS puros, 7 seções: hero KPIs, jornada, linha do tempo conectada, mapa mental SVG interativo com drag & drop, portões/gates, telemetria, simulador) como uma aba/página no webapp React MilesControl. Usuário: "faz uma adaptação de design, mas mantém a estrutura e inclui no app".

## Evidências coletadas (evidência antes de opinião)

| Item | Evidência |
|------|-----------|
| O que é o relatório | 56KB HTML standalone, zero dependências; 7 seções; dados reais embutidos (1394 eventos, 274 notas quality, 503 testes, 23 healed, 39 regras); mapa mental SVG com drag&drop (localStorage `mind-pos-v1`, repulsão 90 iterações) |
| Stack do app | React 19 + Vite + Tailwind + shadcn/ui (19 componentes) + react-router; páginas em `src/pages/` (14), rotas+PAGE_TITLES em `src/App.tsx`, sidebar `src/components/AppSidebar.tsx` (grupos Operação/Pessoas/Controle), mobile `BottomTabBar.tsx` (5 itens) |
| Padrão de dados estáticos | `public/kpi-data.json` servido em `/kpi-data.json` + fetch em `KPI.tsx` (precedente) |
| Dark mode | next-themes `attribute="class"` — tokens Tailwind (bg-card, text-foreground, border) dão tema automático |
| Testes | vitest + testing-library; rule-32 exige teste para componente customizado/hook; 503 testes existentes |
| Restrições repo | DRY, ponytail mode (sem abstração especulativa), sem console.log (rule-30), pre-pr obrigatório, gate fail-closed |

## Análise dos Advisors

### Advisor: The Contrarian
**Análise:** O drag & drop em React é o ponto de maior risco do port. `getComputedTextLength()` só funciona com elemento no DOM (no primeiro render com `useRef` vazio retorna 0) → exige medição pós-mount (`useLayoutEffect`/rAF) com risco de layout thrash; posição como `useState` dispara re-render de ~30 nós a 60fps (jank), como `useRef` o painel de detalhes não atualiza; clique vs drag com limiar de 4px precisa de `SUPPRESS_CLICK` equivalente. **Mitigação:** posição em `useRef` + estado de seleção separado, medição com ref callback + rAF, ou estimativa `label.length * fontSize * 0.62` sem medição real (mais simples e determinística). Bundle: portar reduz peso vs HTML standalone (estilos viram Tailwind); manter dados como constantes tipadas. Dark mode: substituir cores fixas do relatório por tokens — ganho automático.
**Veredito:** Faça, com mitigação explícita do MindMap (medição por estimativa, posição em ref, limiar de drag).

### Advisor: First Principles
**Análise:** (1) Propósito: aba educacional para devs/curiosos que já estão no app (não é onboarding de usuário final de milhas — é conteúdo de processo/qualidade) → rota protegida padrão (login), visível no grupo Controle ao lado de KPIs. (2) Dados: o relatório é *ilustrativo* — congelar constantes é aceitável e honesto (com rótulo "dados ilustrativos de 2026-08-08"); evita fetch e complexidade de re-hydration. (3) Essencial do mapa: nós + conexões + drag; complexidade acidental (repulsão, localStorage) pode ser simplificada no port (repulsão no mount via useMemo, localStorage preservado como bônus). (4) "Adaptação mantendo estrutura" = mesmas 7 seções com tokens Tailwind/shadcn, não reimaginar o conteúdo. (5) Caminho mais simples que mantém experiência: componente React puro com SVG — sem iframe, sem dangerouslySetInnerHTML.
**Veredito:** Faça. Constantes tipadas em `src/lib/`, componente MindMap dedicado, 7 seções preservadas.

### Advisor: The Expansionist
**Análise:** Oportunidades: (a) a aba vira referência viva de "como o MilesControl funciona por dentro" para novos devs; (b) o MindMap pode virar componente reutilizável para outras visualizações; (c) dark mode de graça via tokens; (d) posicionamento: grupo **Controle** com "Workflow" (ícone GitBranch/Workflow) ao lado de KPIs — coerente com dados de processo; mobile: fica acessível via menu do sidebar (BottomTabBar mantém 5 itens principais, sem sobrecarregar). (e) telemetria embutida vs dinâmica: embutida agora (ilustrativo); evolução futura possível via JSON gerado por script.
**Veredito:** Faça. Grupo Controle, ícone Workflow, sem tocar no BottomTabBar.

### Advisor: The Outsider
**Análise:** Perguntas óbvias: (1) público = usuário logado (rota protegida padrão — não precisa role admin, não é dado sensível); (2) por que não iframe/HTML em public/? Usuário pediu *adaptação de design* — port nativo é o que entrega isso (tema, typography, espaçamento do app); iframe quebraria dark mode e pareceria página externa; (3) números congelados envelhecem — mitigar com rótulo de data e seção "dados ilustrativos"; (4) não duplica KPI.tsx (lá é dashboard operacional com kpi-data.json; aqui é narrativa educacional do processo/gates); (5) drag em touch mobile é frágil → manter drag como aprimoramento desktop, com fallback de leitura clicável (clicar nó abre painel sem arrastar).
**Veredito:** Faça. Rota protegida padrão, port nativo, rótulo de dados ilustrativos, fallback clique sem arrasto.

### Advisor: The Executor
**Análise:** Plano: (1) branch `feat/workflow-tab`; (2) `src/lib/workflowDemoData.ts` — constantes tipadas (KPIs, fases, nós do mapa, gates, telemetria, cenários) — recomendado sobre JSON em public/ (sem fetch, tipado, tree-shakeable, testes unitários rule-31); (3) componentes em `src/components/workflow/`: `WorkflowHero`, `WorkflowTimeline`, `WorkflowMindMap` (SVG + pointer events + ref p/ posição + estimativa de largura de texto), `WorkflowGates`, `WorkflowTelemetry`, `WorkflowSimulator`; (4) página `src/pages/Workflow.tsx` monta as seções (Card shadcn + tokens); (5) rota `/workflow` + PAGE_TITLES + item no AppSidebar (grupo Controle, ícone Workflow do lucide); (6) testes: 1 por componente customizado (rule-32) + lib (rule-31); (7) pre-pr → PR. Maior risco: MindMap — mitigar com estimativa de largura, posição em ref, drag com limiar.
**Veredito:** Faça. Ordem: lib → componentes → página → rota/sidebar → testes → pre-pr → PR.

## Peer Review

- **Contrarian** reforça: MindMap em React é o único risco real; estimativa de largura (`label.length * fs * 0.62`) elimina `getComputedTextLength` e o layout thrash. Concorda com posição em ref.
- **First Principles** ajusta: manter as 7 seções e a narrativa; não transformar em dashboard — é educacional.
- **Expansionist** concorda: grupo Controle; não tocar BottomTabBar (5 itens é limite de UX mobile).
- **Outsider** confirma: rota protegida padrão (sem role check extra), fallback clique-sem-arrasto no mapa, rótulo "dados ilustrativos" com data.
- **Executor** confirma: constantes tipadas em lib (não JSON em public/), componentes pequenos por seção, testes por componente.

## Síntese do Chairman

**Consenso:** Faça. Portar o relatório para React nativo: `src/lib/workflowDemoData.ts` (constantes tipadas + rótulo de dados ilustrativos), componentes por seção em `src/components/workflow/` com tokens Tailwind/shadcn (dark mode automático), `src/pages/Workflow.tsx` montando as 7 seções (hero, jornada, linha do tempo conectada, mapa mental interativo com drag&drop, gates, telemetria, simulador), rota `/workflow` + PAGE_TITLES + item "Workflow" no AppSidebar (grupo Controle, ícone Workflow), rota protegida padrão, testes por componente + lib, pre-pr → PR. MindMap: posição em ref, largura por estimativa, drag com limiar, fallback clique. Não tocar BottomTabBar.

**Veredito Final:** Faça

**Próximos Passos:** Superpowers — branch `feat/workflow-tab` → lib de dados + componentes + página → rota/sidebar → testes (rule-31/32) → pre-pr → PR

**Extended Thinking Usado:** sim (council de 5 advisors com peer review; decisão de UI com trade-offs de portabilidade, dados e acessibilidade)
