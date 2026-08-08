/**
 * workflowDemoData.ts — Dados ilustrativos do workflow MilesControl.
 *
 * Port dos dados embutidos em docs/workflow-demo/workflow-illustrated.html
 * para constantes tipadas consumíveis pelos componentes React.
 *
 * ⚠️ Dados ilustrativos congelados em 2026-08-08 (eventos reais do repo na
 * data de geração). Para atualizar, regenerar a partir de docs/tracking/.
 *
 * rule-31: lib com teste unitário (tests/unit/workflow-demo-data.test.ts)
 */

export interface KpiStat {
  value: number;
  label: string;
  sub: string;
}

export interface EventType {
  name: string;
  n: number;
  color: string;
}

export interface GradeBucket {
  name: string;
  n: number;
  color: string;
}

export interface RecentEvent {
  t: string;
  d: string;
  desc: string;
}

export interface JourneyStep {
  dot: string;
  title: string;
  badge: string;
  badgeKind: "gate" | "tele";
  body: string;
  ev: string;
  done?: boolean;
  blocked?: boolean;
}

export interface FluxoTStep {
  side: "left" | "right";
  kind: "step" | "gate" | "fail";
  time: string;
  title: string;
  desc: string;
  tag: string;
  tagKind: "default" | "warn" | "fail";
}

export interface FluxoPhase {
  label: string;
}

export type FluxoItem = { type: "phase"; phase: FluxoPhase } | { type: "step"; step: FluxoTStep };

export interface MindBranch {
  id: string;
  label: string;
  color: string;
  detail: string;
  ev: string;
  kids: string[];
}

export interface GateCard {
  emoji: string;
  title: string;
  question: string;
  how: string;
  rule: string;
  state: string;
  stateKind: "ok" | "fail" | "warn";
}

export interface SimScenario {
  id: "fail" | "ok";
  label: string;
  lines: { text: string; kind: "muted" | "ok" | "fail" | "title" }[];
  summary: string;
  summaryKind: "fail" | "ok";
  hint: string;
}

export const DATA_DATE = "2026-08-08";

export const HERO_META = [
  "✅ 39 regras validadas a cada pre-pr",
  "🛡️ 4 gates de segurança",
  "📡 telemetria em toda etapa",
  "🔄 ciclo: subagente que codifica + subagente que revisa",
];

export const WHAT_CARDS = [
  {
    emoji: "📦",
    title: "Uma ideia entra",
    body: "Uma nova funcionalidade, um bug para corrigir ou uma melhoria. Tudo começa com uma tarefa classificada em uma categoria.",
  },
  {
    emoji: "⚙️",
    title: "Gates verificam",
    body: "No caminho, 4 portões (gates) checam intenção, consistência, autorização e evidência. Se algo faltar, o fluxo para — de propósito.",
  },
  {
    emoji: "📤",
    title: "Entrega sai",
    body: "Com tudo validado, a mudança vira um Pull Request revisado por um subagente especializado e segue para produção com rastro completo.",
  },
];

export const KPI_STATS: KpiStat[] = [
  { value: 1394, label: "eventos registrados", sub: "docs/tracking/events.jsonl" },
  { value: 274, label: "notas de qualidade", sub: "docs/tracking/quality.jsonl" },
  { value: 39, label: "regras de validação", sub: "auto-executadas no pre-pr" },
  { value: 503, label: "testes unitários", sub: "56 arquivos de teste" },
  { value: 23, label: "auto-correções", sub: 'eventos "healed"' },
  { value: 2, label: "novos gates de evidência", sub: "coding + code-review" },
];

export const EVENT_TYPES: EventType[] = [
  { name: "session:start", n: 807, color: "#3b82f6" },
  { name: "pre-pr", n: 324, color: "#8b5cf6" },
  { name: "rule:fail", n: 205, color: "#ef4444" },
  { name: "healed", n: 23, color: "#10b981" },
  { name: "session:end", n: 12, color: "#f59e0b" },
  { name: "llm.route.*", n: 18, color: "#14b8a6" },
  { name: "gate", n: 2, color: "#f43f5e" },
  { name: "custom", n: 1, color: "#64748b" },
  { name: "coding:done", n: 1, color: "#22c55e" },
  { name: "code-review:done", n: 1, color: "#6366f1" },
];

export const MAX_EVENTS = 807;

export const GRADES: GradeBucket[] = [
  { name: "100% — excelente", n: 206, color: "#10b981" },
  { name: "80% — aprovado", n: 62, color: "#84cc16" },
  { name: "60% — abaixo do padrão", n: 6, color: "#ef4444" },
];

export const MAX_GRADE = 206;

export const RECENT_TIMELINE: RecentEvent[] = [
  { t: "2026-08-08 11:13:21", d: "pre-pr", desc: "pre-pr PASS" },
  { t: "2026-08-08 11:12:46", d: "pre-pr", desc: "pre-pr PASS" },
  { t: "2026-08-08 11:11:21", d: "rule:fail", desc: "rule-08-report falhou → corrigido" },
  { t: "2026-08-08 11:10:46", d: "rule:fail", desc: "rule-10-clean falhou → corrigido" },
  { t: "2026-08-08 11:08:25", d: "rule:fail", desc: "rule-26-session-started falhou → corrigido" },
  { t: "2026-08-08 11:08:20", d: "rule:fail", desc: "rule-10-clean falhou → corrigido" },
];

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    dot: "🚀",
    title: "Sessão começa",
    badge: "rule-26",
    badgeKind: "gate",
    body: "Toda sessão de trabalho inicia com `npm run session:start`. O sistema registra um marcador de tempo e carrega o contexto da última sessão (handoff).",
    ev: '{"type":"session:start","description":"sessão iniciada","branch":"feat/minha-mudanca"}\n📄 docs/handoff.md atualizado automaticamente',
    done: true,
  },
  {
    dot: "🗂️",
    title: "Categoria da tarefa",
    badge: "docs certos",
    badgeKind: "tele",
    body: "Cada tarefa tem uma categoria (feature, bugfix, docs, refactor, chore). Ela define quais documentos o agente deve ler — sem leitura desnecessária.",
    ev: "feature → WORKFLOW.md + CONVENTIONS.md\nbugfix  → DEBUG.md + CONVENTIONS.md\ndocs    → apenas AGENTS.md",
  },
  {
    dot: "🧠",
    title: "INTENT Gate",
    badge: "rule-33",
    badgeKind: "gate",
    body: 'Antes de qualquer edição, o agente declara: "o código faz X; o teste espera Y; a spec diz Z". Se os três não baterem, ele não edita — reporta.',
    ev: "INTENT: código faz X; teste espera Y; spec diz Z\n→ se divergirem: NÃO editar, reportar",
  },
  {
    dot: "🔁",
    title: "TWINS Check",
    badge: "rule-34",
    badgeKind: "gate",
    body: "Ao corrigir um bug, o agente busca o mesmo padrão no projeto todo e corrige todas as ocorrências — não só a que apareceu.",
    ev: "TWINS: searched <padrão> — found N locais",
  },
  {
    dot: "🎯",
    title: "Decisão estratégica",
    badge: "rule-27/28",
    badgeKind: "gate",
    body: "Features passam por um Conselho de LLMs (5 perspectivas + síntese) com veredito em docs/council/. Refactors exigem uma spec técnica.",
    ev: "feature  → council-to-superpowers → docs/council/veredito\nrefactor → spec técnica em docs/superpowers/specs/",
  },
  {
    dot: "🛠️",
    title: "Codificação por subagente",
    badge: "rule-39",
    badgeKind: "gate",
    body: "A implementação é executada por um subagente especializado (coder). Ao concluir, um evento coding:done com a marca subagent:true é registrado — é a evidência do gate.",
    ev: '{"type":"coding:done","description":"Codificação por subagente concluída",\n "branch":"chore/code-review-gate","subagent":true,\n "skill":"subagent-driven-development"}',
    done: true,
  },
  {
    dot: "🔎",
    title: "Code Review por subagente",
    badge: "rule-38",
    badgeKind: "gate",
    body: "Antes do PR, um subagente revisor audita o diff de forma independente (read-only), com veredito explícito. O evento code-review:done prova que a revisão aconteceu.",
    ev: '{"type":"code-review:done","description":"Review aprovado por subagente",\n "branch":"chore/code-review-gate","subagent":true,\n "verdict":"approved","skill":"requesting-code-review"}',
    done: true,
  },
  {
    dot: "🧪",
    title: "Testes + Build",
    badge: "quality",
    badgeKind: "tele",
    body: "Testes unitários, build e verificação de docs rodam. A nota de qualidade (outcome grade) é registrada — o padrão mínimo é 80%.",
    ev: "✅ 503 testes · 56 arquivos\n📊 outcome grade: 100% (206 vezes) · 80% (62) · 60% (6)",
  },
  {
    dot: "🛂",
    title: "Pre-pr: 39 regras",
    badge: "telemetria",
    badgeKind: "tele",
    body: "O `npm run pre-pr` valida 39 regras automáticas + gera um relatório HTML. Cada execução fica registrada no events.jsonl. Falhou? Mensagem acionável diz exatamente o que fazer.",
    ev: "🔍 PRE-PR CHECK — 39 regras\n✅ relatório: docs/reports/<data>/PR<n>-*.html\n📡 eventos: pre-pr (324) · rule:fail (205) · healed (23)",
  },
  {
    dot: "🔐",
    title: "AUTH Gate",
    badge: "rule-35",
    badgeKind: "gate",
    body: 'Push, merge e deploy são irreversíveis. Por isso, exigem a palavra exata do usuário ("manda bala", "autorizo"...). Sem a citação, o agente não age.',
    ev: 'AUTH: usuário disse "<citação exata>"\n→ sem citação: não agir',
  },
  {
    dot: "📤",
    title: "PR → review → merge",
    badge: "entrega",
    badgeKind: "tele",
    body: "O Pull Request nasce com relatório anexado, os checks de CI rodam (check-pr, e2e-smoke, Vercel) e, aprovado, é mergeado na main.",
    ev: "branch → PR (base: main) → checks CI → merge → deploy",
  },
  {
    dot: "🏁",
    title: "Sessão encerra",
    badge: "rule-26",
    badgeKind: "tele",
    body: "`npm run session:end` registra o evento final, atualiza o handoff e preserva o contexto para a próxima sessão.",
    ev: '{"type":"session:end","description":"sessão encerrada"}\n📄 handoff.md salvo para a próxima sessão',
  },
  {
    dot: "🚫",
    title: "E se eu pular um gate?",
    badge: "fail-closed",
    badgeKind: "tele",
    body: 'Os gates são fail-closed: sem evidência, o pre-pr falha (exit 1) e mostra a mensagem de como corrigir. Não dá para "empurrar com a barriga" — o sistema prefere parar a liberar.',
    ev: '❌ rule-38: nenhum evento code-review:done na branch feat/x\n   Dica: node scripts/event-log.mjs code-review:done \\\n     "Review aprovado por subagente" --meta \'{"subagent":true}\'',
    blocked: true,
  },
];

export const FLUXO_ITEMS: FluxoItem[] = [
  { type: "phase", phase: { label: "⏱️ Fase 1 · Início" } },
  {
    type: "step",
    step: {
      side: "left",
      kind: "step",
      time: "Passo 1",
      title: "🚀 Sessão inicia",
      desc: "`npm run session:start` registra o timestamp (rule-26) e carrega o handoff da sessão anterior.",
      tag: "📡 session:start",
      tagKind: "default",
    },
  },
  {
    type: "step",
    step: {
      side: "right",
      kind: "step",
      time: "Passo 2",
      title: "🗂️ Categoria da tarefa",
      desc: "Feature, bugfix, docs, refactor ou chore — define quais docs o agente lê. Sem leitura preventiva.",
      tag: "feature → council · bugfix → DEBUG.md",
      tagKind: "default",
    },
  },
  { type: "phase", phase: { label: "⏱️ Fase 2 · Planejamento" } },
  {
    type: "step",
    step: {
      side: "left",
      kind: "gate",
      time: "⚖️ Gate",
      title: "🧠 INTENT",
      desc: "Código, teste e spec contam a mesma história? Divergiu? Não edita — reporta.",
      tag: "⛔ rule-33 · fail-closed",
      tagKind: "warn",
    },
  },
  {
    type: "step",
    step: {
      side: "right",
      kind: "gate",
      time: "⚖️ Gate",
      title: "🔁 TWINS",
      desc: "Mesmo bug em outro lugar? Corrige todas as ocorrências, não só a visível.",
      tag: "⛔ rule-34 · fail-closed",
      tagKind: "warn",
    },
  },
  {
    type: "step",
    step: {
      side: "left",
      kind: "step",
      time: "Passo 3",
      title: "🎯 Decisão estratégica",
      desc: "Feature → council de LLMs (veredito em docs/council/). Refactor → spec técnica. Demais seguem direto.",
      tag: "rule-27 · rule-28",
      tagKind: "default",
    },
  },
  { type: "phase", phase: { label: "⏱️ Fase 3 · Execução" } },
  {
    type: "step",
    step: {
      side: "right",
      kind: "step",
      time: "Passo 4",
      title: "🛠️ Codificação por subagente",
      desc: "O coder (subagente especializado) implementa. Ao concluir, registra a evidência.",
      tag: "📡 coding:done · subagent:true · rule-39",
      tagKind: "default",
    },
  },
  {
    type: "step",
    step: {
      side: "left",
      kind: "step",
      time: "Passo 5",
      title: "🔎 Code Review por subagente",
      desc: "O reviewer (subagente read-only) audita o diff e dá veredito explícito (approved / changes-requested).",
      tag: "📡 code-review:done · subagent:true · rule-38",
      tagKind: "default",
    },
  },
  { type: "phase", phase: { label: "⏱️ Fase 4 · Verificação" } },
  {
    type: "step",
    step: {
      side: "right",
      kind: "step",
      time: "Passo 6",
      title: "🧪 Testes + Build",
      desc: "Testes unitários, build e verify-docs. Outcome grade mínimo: 80% (registrado no quality.jsonl).",
      tag: "📊 503 testes · rule-30/31/32",
      tagKind: "default",
    },
  },
  {
    type: "step",
    step: {
      side: "left",
      kind: "fail",
      time: "Passo 7",
      title: "🛂 Pre-pr — 39 regras",
      desc: "Valida todas as regras automáticas + gera relatório HTML. Qualquer falha bloqueia o PR.",
      tag: "🔒 fail-closed · docs/reports/",
      tagKind: "fail",
    },
  },
  { type: "phase", phase: { label: "⏱️ Fase 5 · Entrega" } },
  {
    type: "step",
    step: {
      side: "right",
      kind: "gate",
      time: "🔐 Gate",
      title: "AUTH",
      desc: 'Push, merge e deploy são irreversíveis → exigem a palavra exata do usuário ("autorizo", "manda bala"...). Sem citação, nada acontece.',
      tag: "⛔ rule-35 · bloqueia ação",
      tagKind: "warn",
    },
  },
  {
    type: "step",
    step: {
      side: "left",
      kind: "step",
      time: "Passo 8",
      title: "📤 PR → CI → merge → deploy",
      desc: "PR com base em main; checks (check-pr, e2e-smoke, Vercel) rodam; merge na main → deploy automático.",
      tag: "📤 post-pr renomeia relatório",
      tagKind: "default",
    },
  },
  {
    type: "step",
    step: {
      side: "right",
      kind: "step",
      time: "Passo 9",
      title: "🏁 Sessão encerra",
      desc: "`npm run session:end` registra o evento final e preserva o contexto no handoff para a próxima sessão.",
      tag: "📡 session:end",
      tagKind: "default",
    },
  },
];

export const FLUXO_LOOP = {
  failArrow: "❌ falhou? ⤵",
  title: "Corrigir → rodar pre-pr de novo",
  desc: "A mensagem diz exatamente o que corrigir. O ciclo repete até 0 errors.",
  tag: "fail-closed",
  okArrow: "✅ 0 errors ⤴ continua",
};

export const MIND: MindBranch[] = [
  {
    id: "sessao",
    label: "🚀 Sessão",
    color: "#3b82f6",
    detail:
      "Toda sessão começa com `npm run session:start` (rule-26) e termina com `session:end`. O docs/handoff.md preserva o contexto entre sessões.",
    ev: '{"type":"session:start","branch":"feat/x"}\n📄 handoff.md atualizado automaticamente',
    kids: ["session:start (rule-26)", "handoff.md", "session:end"],
  },
  {
    id: "categoria",
    label: "🗂️ Categoria",
    color: "#8b5cf6",
    detail:
      "Cada tarefa tem uma categoria (feature, bugfix, docs, refactor, chore) que define quais docs o agente lê — sem leitura preventiva.",
    ev: "feature → WORKFLOW.md + CONVENTIONS.md\nbugfix → DEBUG.md · docs → AGENTS.md",
    kids: ["feature → council", "bugfix → DEBUG.md", "refactor → spec", "docs/chore → AGENTS.md"],
  },
  {
    id: "gates",
    label: "🧠 Gates",
    color: "#f59e0b",
    detail:
      "Os portões de segurança: INTENT (intenção), TWINS (consistência), AUTH (autorização) e Evidence (codificação/revisão por subagente). Todos fail-closed.",
    ev: "INTENT · TWINS · AUTH · coding:done · code-review:done",
    kids: [
      "INTENT (rule-33)",
      "TWINS (rule-34)",
      "AUTH (rule-35)",
      "Evidence (rule-38/39)",
      "Council (rule-27)",
      "RTK (rule-37)",
    ],
  },
  {
    id: "coding",
    label: "🛠️ Codificação",
    color: "#22c55e",
    detail:
      "A implementação é executada por um subagente especializado (coder). Evidência: evento coding:done com subagent:true na branch.",
    ev: '{"type":"coding:done","subagent":true,"skill":"subagent-driven-development"}',
    kids: ["subagente coder", "coding:done (rule-39)"],
  },
  {
    id: "review",
    label: "🔎 Review",
    color: "#6366f1",
    detail:
      "Antes do PR, um subagente revisor audita o diff de forma independente (read-only) e emite veredito. Evidência: code-review:done.",
    ev: '{"type":"code-review:done","subagent":true,"verdict":"approved"}',
    kids: ["subagente reviewer", "code-review:done (rule-38)"],
  },
  {
    id: "qualidade",
    label: "🧪 Qualidade",
    color: "#14b8a6",
    detail:
      "Testes unitários (503), build e verify-docs rodam a cada pre-pr. Outcome grade mínima de 80% — registrada no quality.jsonl.",
    ev: '{"rule":"rule-30","outcomeGrade":100} → quality.jsonl',
    kids: ["503 testes", "build", "outcome grade ≥ 80%", "quality.jsonl"],
  },
  {
    id: "prepr",
    label: "🛂 Pre-pr",
    color: "#f43f5e",
    detail:
      "npm run pre-pr valida 39 regras automáticas e gera relatório HTML. Se algo falhar, mensagem acionável mostra como corrigir. Fail-closed.",
    ev: "pre-pr (324 execuções) · rule:fail (205) · healed (23)",
    kids: ["39 regras", "relatório HTML", "fail-closed"],
  },
  {
    id: "entrega",
    label: "📤 Entrega",
    color: "#f97316",
    detail:
      "PR com base em main → checks de CI (check-pr, e2e-smoke, Vercel) → merge → deploy automático na Vercel.",
    ev: "branch → PR → checks CI → merge → main → Vercel",
    kids: ["PR (base main)", "checks CI", "merge → main", "deploy Vercel"],
  },
  {
    id: "telemetria",
    label: "📡 Telemetria",
    color: "#06b6d4",
    detail:
      "Tudo vira registro auditável: events.jsonl (1394 eventos) e quality.jsonl (274 notas). O rastro é completo de ponta a ponta.",
    ev: "events.jsonl (1394) · quality.jsonl (274) · docs/reports/*.html",
    kids: ["events.jsonl (1394)", "quality.jsonl (274)", "docs/reports/*.html"],
  },
];

export const GATES: GateCard[] = [
  {
    emoji: "🧠",
    title: "INTENT Gate",
    question: "o código, o teste e a spec contam a mesma história?",
    how: "antes de editar, o agente declara os três em uma frase. Se divergirem, reporta em vez de editar.",
    rule: "rule-33",
    state: "fail-closed",
    stateKind: "ok",
  },
  {
    emoji: "🔁",
    title: "TWINS Check",
    question: "o bug existe em outro lugar do projeto?",
    how: "ao corrigir, o agente varre o código buscando o mesmo padrão e corrige todas as ocorrências.",
    rule: "rule-34",
    state: "fail-closed",
    stateKind: "ok",
  },
  {
    emoji: "🔐",
    title: "AUTH Gate",
    question: "o usuário autorizou com as palavras exatas?",
    how: "push/merge/deploy exigem citação literal do usuário. Sem ela, nenhuma ação irreversível.",
    rule: "rule-35",
    state: "bloqueia ação",
    stateKind: "fail",
  },
  {
    emoji: "🛂",
    title: "Evidence Gates",
    question: "a codificação e a revisão foram feitas por subagentes?",
    how: "eventos coding:done e code-review:done com subagent:true na branch são exigidos antes do PR.",
    rule: "rule-38 + rule-39",
    state: "fail-closed",
    stateKind: "ok",
  },
  {
    emoji: "🎯",
    title: "Council / Spec",
    question: "a decisão estratégica foi debatida?",
    how: "features passam por conselho de LLMs (5 visões + síntese); refactors exigem spec técnica versionada.",
    rule: "rule-27 / rule-28",
    state: "por categoria",
    stateKind: "ok",
  },
  {
    emoji: "🤖",
    title: "RTK ativo",
    question: "a análise estrutural de código está disponível?",
    how: "extensão .pi/extensions/rtk.ts versionada + binário ≥ 0.23.0 garantem auditorias por Tree-sitter.",
    rule: "rule-37",
    state: "fail-open",
    stateKind: "warn",
  },
];

export const SIM_SCENARIOS: SimScenario[] = [
  {
    id: "fail",
    label: "🛠️ Enviar PR sem evidência de review",
    lines: [
      { text: "$ npm run pre-pr", kind: "muted" },
      { text: "🔍 PRE-PR CHECK", kind: "title" },
      {
        text: "❌ rule-38: nenhum evento code-review:done na branch feat/x",
        kind: "fail",
      },
      {
        text: '❌   Dica: node scripts/event-log.mjs code-review:done \\\n  "Review aprovado por subagente" --meta \'{"subagent":true}\'',
        kind: "fail",
      },
      { text: "❌ rule-39: nenhum evento coding:done na branch feat/x", kind: "fail" },
      { text: "⚠️  arquivos não commitados (unstaged/untracked)", kind: "muted" },
      { text: "═══════════════════════════════════", kind: "muted" },
      { text: "❌ 3 errors — PR BLOQUEADO (fail-closed)", kind: "fail" },
      {
        text: '➡️  O sistema não libera: falta evidência. Sem "empurrar com a barriga".',
        kind: "muted",
      },
    ],
    summary: "❌ 3 errors — PR BLOQUEADO (fail-closed)",
    summaryKind: "fail",
    hint: '➡️  O sistema não libera: falta evidência. Sem "empurrar com a barriga".',
  },
  {
    id: "ok",
    label: "✅ Fluxo completo com evidências",
    lines: [
      { text: "$ npm run pre-pr", kind: "muted" },
      { text: "🔍 PRE-PR CHECK — 39 regras", kind: "title" },
      {
        text: "✅ rule-38: code review por subagente confirmado (evento code-review:done)",
        kind: "ok",
      },
      {
        text: "✅ rule-39: codificação por subagente confirmada (evento coding:done)",
        kind: "ok",
      },
      { text: "✅ rule-33: INTENT Gate documentado", kind: "ok" },
      { text: "✅ rule-34: TWINS Check referenciado", kind: "ok" },
      { text: "✅ rule-35: AUTH Gate com frase exata", kind: "ok" },
      { text: "✅ rule-37: rtk 0.45.0 >= 0.23.0", kind: "ok" },
      { text: "✅ test (unit) — 503 testes", kind: "ok" },
      { text: "✅ build · ✅ verify-docs:strict", kind: "ok" },
      { text: "═══════════════════════════════════", kind: "muted" },
      { text: "✅ 0 errors — PR LIBERADO", kind: "ok" },
      {
        text: "➡️  Evidência completa + testes verdes + docs consistentes.",
        kind: "muted",
      },
    ],
    summary: "✅ 0 errors — PR LIBERADO",
    summaryKind: "ok",
    hint: "➡️  Evidência completa + testes verdes + docs consistentes.",
  },
];

export function kpiForId(id: string): KpiStat | undefined {
  return KPI_STATS.find((s) => s.value === Number(id));
}
