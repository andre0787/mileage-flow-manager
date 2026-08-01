# Veredito do Council — KPIs de Processo: Dados Reais

> **Data:** 2026-08-01
> **Categoria:** feature
> **Solicitação:** Aba "KPIs de Processo" deve refletir dados reais do fluxo daqui pra frente (sem popular histórico). Ajustar fluxo/scripts seguindo o workflow.

## Diagnóstico (evidências)

Os dados **são reais** na origem (`docs/tracking/events.jsonl` → `npm run kpi` → `public/kpi-data.json`), mas o pipeline tem 4 defeitos que fazem a aba parecer mockada:

1. **Poluição por testes unitários** — `tests/unit/scripts-session-start.test.ts` roda `session-start --set-category` com placeholders ("corrige bug", "refatora modulo", "primeira feature", "teste docs", "continuacao", "segunda chore", "verifica output") → 873/1046 eventos do log são bursts de teste, não sessões reais.
2. **Gates nunca emitidos** — `event-log.mjs` não aceita tipo `gate`; INTENT/TWINS/AUTH são declarados no fluxo mas nunca registrados → `gateActivations` sempre 0.
3. **3 KPIs sem fonte** — `kpi-report.mjs` tenta extrair "outcome grade"/"cobertura" via regex do HTML, mas `generate-report.mjs` não emite esses dados → `avgOutcomeGrade`, `testCoverageLibs`, `testCoverageComponents`, `topViolations` sempre null/vazios.
4. **JSON stale** — `kpi-data.json` só regenera manualmente; não roda no pre-pr/CI; mês corrente ausente; `avgCycleTimeDays` em dias → sempre 0.0.

## Advisors

- **Contrarian:** Escopo cirúrgico — não mudar o formato do relatório HTML; capturar os valores no momento em que as rules rodam; limpeza por padrão de burst de teste, não por descrição genérica.
- **First Principles:** O que é medido por testes não é processo real — emitir eventos na origem é superior a inferir de artefatos (regex). KPI sem fonte única verificável não é KPI.
- **Expansionist:** Fecha o loop do Fable Method — gates passam de regras documentadas a métricas observáveis; `topViolations` derivado de `rule:fail` já existente; rodar `kpi` no pre-pr dá rastreabilidade por PR.
- **Outsider:** O JSON stale (nunca regenerado no fluxo) é o motivo de parecer mockado; diferenciar "sem dados" de "não medido" é cosmético — o essencial é o JSON fresco e completo.
- **Executor:** 4 mudanças pequenas em scripts + 1 teste + regenerar JSON; viável em 1 sessão; risco baixo; hermetizar os testes unitários (env guard) para nunca mais poluir.

**Peer Review:** Consenso — emitir na origem, limpeza precisa (não por descrição), quality estruturado em vez de regex de HTML, manter relatório intacto, ciclo em horas.

## Síntese do Chairman

Consenso: dados já são reais na origem, mas 4 defeitos fazem a aba parecer mockada. Correção cirúrgica aprovada: (1) hermetizar testes; (2) limpeza retroativa de bursts; (3) emitir gates; (4) fechar KPIs vazios via quality.jsonl e rule:fail; (5) frescor via pre-pr; (6) regenerar JSON.

## Veredito: FAÇA

Escopo cirúrgico (consenso dos 5 advisors):

1. **Hermeticidade de testes** — testes não escrevem no log de produção (env guard / log temporário)
2. **Limpeza retroativa precisa** — remover apenas bursts de teste (≥3 `session:start` no mesmo segundo com descrições placeholder); preservar eventos reais
3. **Emitir gate events** — `event-log.mjs` aceita `gate`; fluxo passa a logar INTENT/TWINS/AUTH
4. **Fechar KPIs vazios** — `gateActivations` lê eventos `gate`; `topViolations` lê `rule:fail`; grade/cobertura de artefato estruturado gravado pelas rules 30/31/32 no pre-pr (sem regex de HTML)
5. **Frescor** — `npm run kpi` roda no pre-pr; `avgCycleTimeDays` em horas
6. **Regenerar** `kpi-data.json` com dados reais

**Extended Thinking usado:** não
**Riscos:** baixo — nada toca dados financeiros, formato de relatório HTML ou regras de validação
**Próximos passos:** Superpowers — brainstorming → spec → plan → implementação → pre-pr → PR (branch `feat/kpi-dados-reais`)
