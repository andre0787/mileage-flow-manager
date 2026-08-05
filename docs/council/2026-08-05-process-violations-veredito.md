# Veredito do Council — Travas de mitigação das top violações do KPI de processo

> **Data:** 2026-08-05
> **Sessão:** feature — planejar e implementar travas para mitigar top violações do KPI de processo
> **Fonte de dados:** `docs/tracking/events.jsonl` (agosto/2026, via `kpi-report.mjs`)

## Contexto (dados reais)

| Regra | Falhas | Classe |
|-------|--------|--------|
| rule-10-clean (git status limpo) | 65 | Mecânica (artefatos do próprio workflow ficam unstaged) |
| rule-26-session-started (branch da sessão) | 31 | Mecânica (session:start antes de criar a branch) |
| rule-17-new-docs-valid (MAP.md) | 12 | Semi-mecânica (docs gerados por skills sem auto-registro) |
| rule-27-council-veredict (council feature) | 6 | Gate de julgamento (fricção intencional) |
| rule-02-category-loading (docs por categoria) | 4 | Mecânica (categoria herdada sem re-sync) |

118 eventos `rule:fail` em 51 pre-pr FAILs (151 execuções; pass rate 66,2%).
~2-4h/mês de fricção manual estimada (retries de pre-pr).

## Advisors

### Advisor: The Contrarian

**Análise:** O perigo central é o **auto-healing transformar o KPI em mentira**. Se o pre-pr corrige tudo sozinho, `rule:fail` some do events.jsonl e o KPI mostra 0 violações — não porque o processo melhorou, mas porque deixou de medir. Especificamente: (1) `git add` automático no hook pode commitar lixo (logs, fixtures de debug) — mitigar com whitelist de artefatos conhecidos; (2) auto-registro no MAP.md pode poluir um índice curado com entradas inúteis; (3) auto-update de branch no handoff pode mascarar um problema real de sessão na branch errada. E o caso rule-27 é suspeito: 6 falhas em features — se o council é obrigatório e o usuário não rodou, **a trava JÁ funcionou** (bloqueou o commit). "Mitigar" rule-27 pode significar enfraquecer um gate intencional.

**Veredito:** Reformule — auto-heal apenas para violações *mecânicas* comprovadas (rule-10, rule-26, rule-02); manter gates de *julgamento* (rule-27, rule-17) com auto-heal parcial (MAP.md auto-registrado com marcação clara "auto"); telemetria deve registrar `healed` separado de `violation`.

### Advisor: First Principles Thinker

**Análise:** Por que o KPI existe? Para medir **custo de fricção do processo**, não virtude moral. Uma violação que o script sabe corrigir sozinho (branch do handoff desatualizada) não é falha de disciplina — é **atrito mecânico mal desenhado**. O princípio: *o computador deve fazer trabalho mecânico; o humano deve fazer julgamento*. rule-10/26/02 são 100% mecânicas — o sistema tem toda a informação (branch atual, categoria, arquivos) e ainda assim delega ao humano o `git add` e o `session:start` repetido. rule-27/35/33 (council/auth/intent) são gates de julgamento — não podem auto-corrigir, mas podem (a) falhar com mensagem de ação acionável, (b) registrar o bloqueio como ativação de gate (evento distinto), não como violação.

**Veredito:** Faça — auto-heal mecânico + separar telemetria (healed/blocked/violation), com gate de julgamento intacto.

### Advisor: The Expansionist

**Análise:** Oportunidades: (1) cada auto-heal registra um evento `healed` com regra e causa → o KPI ganha métrica nova "fricção removida" (impacto real mensurável); (2) o padrão de auto-heal no pre-pr é replicável para outras regras mecânicas; (3) MAP.md auto-registrado com seção "Índice gerado" mantém o índice curado intacto; (4) o mesmo mecanismo de staging pode cobrir handoff.md + relatórios → rule-10 despenca; (5) meta: zero violações mecânicas no mês seguinte.

**Veredito:** Faça — e adicione `healed` à telemetria + métrica no dashboard /kpi.

### Advisor: The Outsider

**Análise:** Se o pre-pr *sabe* que o handoff está com a branch errada, por que ele não atualiza em vez de gritar "Execute: npm run session:start"? Por que o hook gera um relatório HTML que fica untracked e depois acusa o usuário de working tree sujo? O processo atual pune o usuário por algo que o script causou. 151 pre-prs em um mês é volume alto; 118 falhas ≈ 2-4 horas de fricção pura no mês. As travas devem eliminar a *classe* de erro, não a ocorrência individual.

**Veredito:** Faça — ataque as classes: (1) staging completo de artefatos no hook, (2) auto-sync de branch/categoria no handoff, (3) auto-registro MAP.md, (4) mensagens acionáveis nos gates de julgamento.

### Advisor: The Executor

**Análise:** Viabilidade por trava: (A) rule-10 → adicionar `docs/handoff.md` ao `GENERATED_ARTIFACTS` + staging automático pós-pre-pr — trivial, testável; (B) rule-26 → pre-pr detecta divergência e auto-atualiza o handoff (com evento `healed:rule-26`) — médio, cuidado com loop (auto-update não deve re-disparar regras); (C) rule-17 → auto-append no MAP.md com seção gerada + re-validação — médio, escopo decidir; (D) rule-27 → manter bloqueio, adicionar mensagem com comando exato do council + telemetria distinta; (E) rule-02 → auto-sync igual ao B. Testes: regras têm fixtures (`__fixtures__`), padrão TDD do projeto. Risco principal: `git add` automático commitar arquivos não intencionais — whitelist mitigável; auto-heal do handoff exige execução não-interativa.

**Veredito:** Faça — escopo em 2 fases: fase 1 = A+B+E (mecânicas, ~90% das violações), fase 2 = C+D (MAP.md auto + telemetria de gates).

## Peer Review (resumido)

- Contrarian reforça: **nunca auto-corrigir gate de julgamento**; telemetria `healed` ≠ `violation` (aceito por todos).
- First Principles: KPI deve medir fricção mecânica + ativação de gates separadamente (concordância unânime).
- Expansionist: métrica "fricção removida" vira KPI novo (aceito; fase 2).
- Outsider: hook causa o problema (relatório untracked) — o fix do hook deve incluir o staging do que ele próprio gerou (aceito).
- Executor: fase 1 não toca rule-17/27 (mantém gates); fase 2 com marcação "auto" no MAP.md (aceito).

## Síntese do Chairman

**Consenso:** Auto-healing para violações 100% mecânicas; gates de julgamento intactos com mensagens acionáveis; telemetria separando `healed` (auto-corrigido) de `violation` (humano ignorou) e ativações de gate (julgamento acionado).

**Veredito Final:** **Faça** — Fase 1 (esta sessão): travas A (rule-10: staging completo + handoff nos artefatos), B (rule-26: auto-sync de branch), E (rule-02: auto-sync de categoria/docs) + telemetria `healed`. Fase 2 (próxima sessão): C (MAP.md auto-registrado), D (mensagens acionáveis + telemetria de gates).

**Próximos Passos:** brainstorming → spec → TDD (RED → GREEN) → pre-pr → PR. Guards novos para as travas.

**Extended Thinking Usado:** não
