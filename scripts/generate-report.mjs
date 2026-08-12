#!/usr/bin/env node

/**
 * generate-report.mjs — Briefing executivo de sessão (HTML).
 *
 * Transforma o diff + telemetria da sessão (events.jsonl/quality.jsonl) em
 * uma apresentação de impacto para líderes:
 *   • Slide 1 — One-Pager Executivo (BLUF): decisão, impacto, trade-offs + KPIs
 *   • Slide 2 — Impacto: Produto / Negócio / Processo (antes → depois)
 *   • Slide 3 — Timeline da sessão + métricas DORA-like
 *   • Slide 4 — Apêndice técnico (checklist, arquivos, diff, tokens)
 *
 * Modos de visualização (no próprio HTML):
 *   • Deck: slides fullscreen navegáveis (← → espaço, F fullscreen, P imprimir)
 *   • Print/PDF: tema claro, one-pager executivo primeiro, apêndice depois
 *
 * Uso:
 *   node scripts/generate-report.mjs                          # preview
 *   node scripts/generate-report.mjs "Nome" --write           # salva em docs/reports/<data>/
 *   node scripts/generate-report.mjs "Nome" --prefix PR99     # prefixo custom
 *   node scripts/generate-report.mjs "Nome" --evidence URL    # screenshot inline
 *   node scripts/generate-report.mjs "Nome" --summary "1 frase"          # BLUF decisão
 *   node scripts/generate-report.mjs "Nome" --impact-produto "texto"     # impacto produto
 *   node scripts/generate-report.mjs "Nome" --impact-negocio "texto"     # impacto negócio
 *   node scripts/generate-report.mjs "Nome" --impact-processo "texto"    # impacto processo
 *   node scripts/generate-report.mjs "Nome" --rows "Item|Fix|Beneficio|Impacto|~200"
 *   node scripts/generate-report.mjs "Nome" --tests 734 --write
 *   npm run report --rename PR103
 *
 * ponytail: template string + execSync, zero deps
 */

import { execSync } from "child_process";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  renameSync,
} from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const EVENTS_FILE = resolve(ROOT, "docs/tracking/events.jsonl");
const QUALITY_FILE = resolve(ROOT, "docs/tracking/quality.jsonl");

// ── Help ───────────────────────────────────────────────────────────────
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Uso: node scripts/generate-report.mjs [descrição] [flags]

Flags:
  --write              Salva em docs/reports/<data>/
  --prefix <prefixo>   Prefixo (PR<num>, fix, feat, docs, chore, auto)
  --summary <texto>    Frase de decisão (BLUF) — "o que foi entregue e por que importa"
  --impact-produto <texto>  Impacto para o usuário final (produto)
  --impact-negocio <texto>  Impacto de negócio (tempo/risco/custo evitado)
  --impact-processo <texto> Impacto no processo de desenvolvimento
  --benefits <texto>   (alias) Benefícios — usado como impacto de produto
  --impact <texto>     (alias) Impacto no negócio
  --rows <linha>       Tabela: item|correção|benefício|impacto|token (múltiplo)
  --evidence <URL>     URL de screenshot — inline no relatório
  --tests <N>          Total de testes (card de qualidade); auto se omitido
  --before <texto>     Descrição do estado anterior
  --after <texto>      Descrição do estado atual
  --rename PR<num>     Renomeia relatórios para prefixo PR<num>
  --date YYYY-MM-DD    Data para --rename (padrão: hoje)
  --help, -h           Mostra esta ajuda

Exemplos:
  npm run report "Auditoria dark mode" --summary "UX dark legível" --impact-produto "..." --impact-negocio "..." --impact-processo "..." --write
  npm run report --rename PR103
`);
  process.exit(0);
}

const TASK = process.argv[2] || "auto";
const PREFIX = (() => {
  const idx = process.argv.indexOf("--prefix");
  return idx !== -1 ? process.argv[idx + 1] || "auto" : "auto";
})();
const SHOULD_WRITE = process.argv.includes("--write");

function collectArgs(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return "";
  const parts = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) break;
    parts.push(process.argv[i]);
  }
  return parts.join("\n");
}

const SUMMARY = collectArgs("--summary");
const IMPACT_PRODUTO = collectArgs("--impact-produto") || collectArgs("--benefits");
const IMPACT_NEGOCIO = collectArgs("--impact-negocio") || collectArgs("--impact");
const IMPACT_PROCESSO = collectArgs("--impact-processo");
const EVIDENCE_URL = collectArgs("--evidence");
const BEFORE_TEXT = collectArgs("--before");
const AFTER_TEXT = collectArgs("--after");
const TESTS_FLAG = (() => {
  const idx = process.argv.indexOf("--tests");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) || null : null;
})();

// Rows da tabela: pipe-separated: item|correcao|beneficio|impacto_negocio|custo_token
const TABLE_ROWS = (() => {
  const idx = process.argv.indexOf("--rows");
  if (idx === -1) return [];
  const rows = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) break;
    const parts = process.argv[i].split("|").map((s) => s.trim());
    if (parts.length >= 5) {
      rows.push({ item: parts[0], fix: parts[1], benefit: parts[2], impact: parts[3], tokens: parts[4] });
    }
  }
  return rows;
})();

function git(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", timeout: 10_000 }).trim();
  } catch {
    return "n/a";
  }
}

// ── Obtém diff ───────────────────────────────────────────────────────

function getDiff() {
  const mergeBase = git("git merge-base HEAD origin/main 2>/dev/null || git rev-list --max-parents=0 HEAD");
  const diff = git(`git diff ${mergeBase}..HEAD`);
  return diff !== "n/a" ? diff : git("git diff HEAD~1..HEAD");
}

function getChangedFiles() {
  const mergeBase = git("git merge-base HEAD origin/main 2>/dev/null || git rev-list --max-parents=0 HEAD");
  const out = git(`git diff ${mergeBase}..HEAD --name-status`);
  if (out === "n/a") return git("git diff HEAD~1..HEAD --name-status");
  return out;
}

function getBranch() {
  return git("git rev-parse --abbrev-ref HEAD");
}

function getCommit() {
  return git("git log -1 --format='%h — %s'");
}

function getPR() {
  const branch = getBranch();
  try {
    const out = execSync(`gh pr list --head "${branch}" --json number,title 2>/dev/null`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 5_000,
    });
    const list = JSON.parse(out);
    if (list.length > 0) return { number: list[0].number, title: list[0].title };
  } catch {}
  return null;
}

// ── Auto-métricas da sessão ──────────────────────────────────────────

/** Lê docs/tracking/events.jsonl e devolve eventos do dia atual (ordem cronológica). */
export function readTodayEvents(now = new Date()) {
  if (!existsSync(EVENTS_FILE)) return [];
  try {
    const today = now.toISOString().slice(0, 10);
    return readFileSync(EVENTS_FILE, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((e) => (e.timestamp || "").startsWith(today));
  } catch {
    return [];
  }
}

/** Lê docs/tracking/quality.jsonl e devolve outcomeGrades do dia. */
export function readTodayQuality(now = new Date()) {
  if (!existsSync(QUALITY_FILE)) return [];
  try {
    const today = now.toISOString().slice(0, 10);
    return readFileSync(QUALITY_FILE, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((e) => (e.timestamp || "").startsWith(today) && typeof e.outcomeGrade === "number");
  } catch {
    return [];
  }
}

/**
 * Computa métricas de impacto da sessão a partir dos eventos do dia.
 * Retorna { leadTimeMin, prePrTotal, prePrPass, prePrFail, ruleFails,
 * healed, codings, reviews, prMerges, prMergeAt, outcomeGrade, tests, timeline }
 */
export function computeSessionMetrics(events, quality = [], tests = null) {
  const prePr = events.filter((e) => e.type === "pre-pr");
  const prePrPass = prePr.filter((e) => (e.description || "").includes("PASS") || e.errors === 0).length;
  const prePrFail = prePr.length - prePrPass;
  const ruleFails = events.filter((e) => e.type === "rule:fail").length;
  const healed = events.filter((e) => e.type === "healed").length;
  const codings = events.filter((e) => e.type === "coding:done").length;
  const reviews = events.filter((e) => e.type === "code-review:done").length;
  // Ordena por timestamp (o arquivo pode ter escrita fora de ordem) — o merge
  // mais recente do dia define o fim da janela de entrega
  const prMerges = events
    .filter((e) => e.type === "pr:merge")
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  const prMergeAt = prMerges.length > 0 ? prMerges[prMerges.length - 1].timestamp : null;
  const firstStart = events.find((e) => e.type === "session:start")?.timestamp || null;
  const leadTimeMin = firstStart && prMergeAt
    ? Math.max(1, Math.round((new Date(prMergeAt) - new Date(firstStart)) / 60000))
    : null;

  const avgGrade = quality.length > 0
    ? Math.round(quality.reduce((s, q) => s + q.outcomeGrade, 0) / quality.length)
    : null;

  // Timeline narrativa: pontos principais com timestamps reais
  const picks = [
    { type: "session:start", label: "Início da sessão" },
    { type: "coding:done", label: "Implementação concluída" },
    { type: "code-review:done", label: "Code review aprovado" },
    { type: "pre-pr", label: "Validação pré-PR", match: (d) => d.includes("PASS") },
    { type: "pr:create", label: "PR aberto" },
    { type: "pr:merge", label: "Merge em produção" },
  ];
  const timeline = [];
  for (const pick of picks) {
    const found = events.find((e) => e.type === pick.type && (!pick.match || pick.match(e.description || "")));
    if (found) {
      timeline.push({
        label: pick.label,
        ts: found.timestamp,
        time: (found.timestamp || "").slice(11, 16),
        type: pick.type,
      });
    }
  }

  return {
    leadTimeMin,
    prePrTotal: prePr.length,
    prePrPass,
    prePrFail,
    ruleFails,
    healed,
    codings,
    reviews,
    prMerges: prMerges.length,
    outcomeGrade: avgGrade,
    tests,
    timeline,
  };
}

/** Ponto de saúde do período (verde/âmbar/vermelho) baseado nas métricas. */
export function sessionHealth(m) {
  // Desconta violações auto-corrigidas (healed): o que importa é o que sobrou
  const net = (m.ruleFails || 0) - (m.healed || 0);
  if (m.prMerges === 0 && net > 10) return { label: "Precisa atenção", color: "#f87171", tone: "red" };
  if (m.prePrFail > 3 || net > 8) return { label: "Sob atenção", color: "#fbbf24", tone: "amber" };
  return { label: "Saudável", color: "#34d399", tone: "green" };
}

// ── Estima tokens ────────────────────────────────────────────────────

function estimateTokens(diff) {
  const lines = diff.split("\n").length;
  const additions = (diff.match(/^\+/gm) || []).length;
  const deletions = (diff.match(/^-/gm) || []).length;
  const totalTokens = Math.round(lines * 0.75);
  const addTokens = Math.round(additions * 0.75);
  const delTokens = Math.round(deletions * 0.75);
  const overheadTokens = totalTokens - addTokens - delTokens;
  return { lines, additions, deletions, tokens: totalTokens, addTokens, delTokens, overheadTokens };
}

// ── Gera HTML ─────────────────────────────────────────────────────────

export function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(s) {
  return escapeHTML(s).replace(/\n/g, "<br>");
}

function formatLeadTime(min) {
  if (min == null) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m > 0 ? `${String(m).padStart(2, "0")}m` : ""}`;
}

export function generateHTML({
  task,
  diff,
  changedFiles,
  branch,
  commit,
  pr,
  metrics,
  tableRows,
  evidenceUrl,
  beforeText,
  afterText,
  summary,
  impactProduto,
  impactNegocio,
  impactoProcesso,
  session,
}) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const safeName = task
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const prefix = pr ? `PR${pr.number}` : PREFIX;

  const filesTable = changedFiles
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 30)
    .map((l) => {
      const [status, ...pathParts] = l.trim().split(/\s+/);
      const path = pathParts.join(" ");
      return `<tr><td>${status}</td><td>${path}</td></tr>`;
    })
    .join("\n");

  const prHtml = pr
    ? `<span class="badge pr">PR #${pr.number}</span>`
    : `<span class="badge auto">auto</span>`;

  const prefixType = prefix.startsWith("fix")
    ? "fix"
    : prefix.startsWith("feat")
      ? "feat"
      : prefix.startsWith("docs")
        ? "docs"
        : prefix.startsWith("chore")
          ? "chore"
          : "auto";
  const prefixBadge = `<span class="badge ${prefixType}">${prefix}</span>`;

  // ── Nível de Risco (auto-detectado dos arquivos) ──────────────
  const fileList = changedFiles.split("\n").filter((l) => l.trim());
  const filePaths = fileList.map((l) => l.replace(/^\S+\s+/, ""));
  const hasMigration = filePaths.some((p) => p.includes("migration") || p.includes("supabase/migrations"));
  const hasSchema = filePaths.some((p) => p.includes("supabase-types") || p.includes("schema"));
  const hasCoreLib = filePaths.some((p) => p.startsWith("src/lib/") && !p.includes("logger"));
  const hasOnlyDocs = filePaths.every((p) => p.startsWith("docs/") || p.startsWith("scripts/") || p.startsWith(".pi/") || p.includes(".md"));
  let riskLevel, riskColor;
  if (hasMigration || hasSchema) {
    riskLevel = "Alto"; riskColor = "#f87171";
  } else if (hasOnlyDocs) {
    riskLevel = "Baixo"; riskColor = "#34d399";
  } else {
    riskLevel = "Médio"; riskColor = "#fbbf24";
  }
  const riskBadge = `<span class="badge risk" style="color:${riskColor}">${riskLevel} risco</span>`;

  // ── Checklist automático (apêndice) ────────────────────────────
  const checks = [];
  if (hasMigration || hasSchema) checks.push("🔷 Migração de banco aplicada?");
  if (filePaths.some((p) => p.startsWith("src/components/") || p.startsWith("src/pages/"))) checks.push("🖼️ Renderização verificada em desktop e mobile?");
  if (filePaths.some((p) => p.startsWith("src/hooks/"))) checks.push("🔌 Hooks testados em tela real?");
  if (hasCoreLib) checks.push("📦 Biblioteca testada com casos de borda?");
  if (filePaths.some((p) => p.includes("FeedbackDialog") || p.includes("feedback"))) checks.push("📬 Feedback flow testado (anon + auth)?");
  if (filePaths.some((p) => p.includes(".github/"))) checks.push("🤖 CI workflow válido? (sintaxe YAML)");
  if (filePaths.some((p) => p.endsWith(".test.") || p.endsWith(".spec."))) checks.push("🧪 Testes existentes passam?");
  if (!filePaths.some((p) => p.endsWith(".test.") || p.endsWith(".spec."))) checks.push("🧪 Testes manuais realizados?");
  checks.push("📋 Regras de validação passam? (npm run pre-pr)");

  // ── Métricas da sessão ─────────────────────────────────────────
  const sm = session || {};
  const health = sessionHealth(sm);
  const leadTime = formatLeadTime(sm.leadTimeMin);
  // Janela longa (> 8h) = proxy de dia inteiro (múltiplas sessões), não lead time de mudança única
  const leadTimeLabel =
    sm.leadTimeMin != null && sm.leadTimeMin > 480
      ? "janela de entrega (dia)"
      : "lead time (início → produção)";
  const friction = sm.prePrTotal > 0
    ? `${sm.prePrFail}/${sm.prePrTotal}`
    : "—";
  const qualityCard = sm.tests != null
    ? `${sm.tests}`
    : sm.outcomeGrade != null
      ? `${sm.outcomeGrade}`
      : "—";
  const qualityLabel = sm.tests != null ? "testes ✅" : sm.outcomeGrade != null ? "outcome grade" : "qualidade";
  const qualityTone = sm.tests != null || (sm.outcomeGrade != null && sm.outcomeGrade >= 80) ? "green" : "amber";

  const kpiCards = `
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-value">${sm.prMerges ?? "—"}</div>
        <div class="kpi-label">entregas em produção</div>
        <div class="kpi-sub">${sm.codings ?? 0} implementações · ${sm.reviews ?? 0} reviews</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${leadTime}</div>
        <div class="kpi-label">${leadTimeLabel}</div>
        <div class="kpi-sub">da sessão ao deploy</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${friction}</div>
        <div class="kpi-label">fricção pré-PR (fail/total)</div>
        <div class="kpi-sub">${sm.ruleFails ?? 0} violações · ${sm.healed ?? 0} auto-corrigidas</div>
      </div>
      <div class="kpi">
        <div class="kpi-value ${qualityTone}">${qualityCard}</div>
        <div class="kpi-label">${qualityLabel}</div>
        <div class="kpi-sub">${riskLevel.toLowerCase()} risco da mudança</div>
      </div>
    </div>`;

  // ── Timeline ───────────────────────────────────────────────────
  const timelineHtml = sm.timeline && sm.timeline.length > 0
    ? `<div class="timeline">
        ${sm.timeline
          .map(
            (t) => `<div class="tl-item ${t.type}">
              <div class="tl-dot"></div>
              <div class="tl-body">
                <div class="tl-time">${t.time}</div>
                <div class="tl-label">${t.label}</div>
              </div>
            </div>`,
          )
          .join("")}
        ${sm.leadTimeMin != null
          ? `<div class="tl-total">⏱ ${leadTime} do início à produção</div>`
          : ""}
      </div>`
    : `<div class="empty-note">Sem eventos de telemetria para hoje nesta branch — rode <code>npm run session:start</code> no início das sessões.</div>`;

  // ── Impacto (slides 2) ─────────────────────────────────────────
  const impactBlocks = [
    { icon: "🎯", title: "Impacto de Produto", text: impactProduto, tone: "blue" },
    { icon: "🏢", title: "Impacto de Negócio", text: impactNegocio, tone: "gold" },
    { icon: "🌊", title: "Impacto de Processo", text: impactoProcesso, tone: "teal" },
  ].filter((b) => b.text);

  const impactHtml = impactBlocks.length > 0
    ? `<section class="slide" id="s2">
        <div class="slide-head">
          <span class="slide-kicker">Impacto da sessão</span>
          <h2>O que isso significa para o negócio</h2>
        </div>
        <div class="impact-grid">
          ${impactBlocks
            .map(
              (b) => `<div class="impact-card ${b.tone}">
                <div class="impact-icon">${b.icon}</div>
                <h3>${b.title}</h3>
                <p>${nl2br(b.text)}</p>
              </div>`,
            )
            .join("")}
        </div>
      </section>`
    : "";

  // ── BLUF (slide 1) ─────────────────────────────────────────────
  const defaultSummary = summary || "Entrega concluída e validada — detalhes técnicos no apêndice.";
  const blufHtml = `
    <section class="slide" id="s1">
      <div class="hero">
        <div class="hero-top">
          <div class="hero-badges">${prHtml} ${prefixBadge} ${riskBadge} <span class="badge health ${health.tone}" style="color:${health.color}">● ${health.label}</span></div>
          <div class="hero-date">${date} · ${time} · <span class="mono">${branch}</span></div>
        </div>
        <h1>${escapeHTML(task)}</h1>
        <p class="hero-summary">${escapeHTML(defaultSummary)}</p>
        <div class="hero-meta mono">${escapeHTML(commit)}</div>
      </div>
      ${kpiCards}
      <div class="bluf">
        <div class="bluf-col">
          <div class="bluf-label">Decisão & entregas</div>
          <p>${impactProduto ? nl2br(impactProduto) : "Detalhes no apêndice técnico."}</p>
        </div>
        <div class="bluf-col">
          <div class="bluf-label">Impacto esperado</div>
          <p>${impactNegocio ? nl2br(impactNegocio) : "Detalhes no apêndice técnico."}</p>
        </div>
        <div class="bluf-col">
          <div class="bluf-label">Riscos & trade-offs</div>
          <p>${riskLevel} risco de mudança · ${qualityLabel.toLowerCase()} ${qualityCard === "—" ? "" : `= ${qualityCard}`} · lead time ${leadTime}.</p>
        </div>
      </div>
    </section>`;

  // ── Slide timeline ─────────────────────────────────────────────
  const timelineSlide = `
    <section class="slide" id="s3">
      <div class="slide-head">
        <span class="slide-kicker">Execução</span>
        <h2>Timeline da sessão</h2>
      </div>
      <div class="split">
        <div class="split-left">${timelineHtml}</div>
        <div class="split-right">
          <div class="stat-list">
            <div class="stat"><span class="stat-v">${sm.prePrTotal ?? "—"}</span><span class="stat-l">rodadas de validação pré-PR</span></div>
            <div class="stat"><span class="stat-v">${sm.ruleFails ?? "—"}</span><span class="stat-l">violações de regra encontradas</span></div>
            <div class="stat"><span class="stat-v green">${sm.healed ?? "—"}</span><span class="stat-l">violações mecânicas auto-corrigidas</span></div>
            <div class="stat"><span class="stat-v">${sm.prePrFail ?? "—"}</span><span class="stat-l">rodadas que exigiram correção</span></div>
          </div>
        </div>
      </div>
    </section>`;

  // ── Token bar ──────────────────────────────────────────────────
  const pctAdd = metrics.tokens > 0 ? Math.round((metrics.addTokens / metrics.tokens) * 100) : 0;
  const pctDel = metrics.tokens > 0 ? Math.round((metrics.delTokens / metrics.tokens) * 100) : 0;
  const pctOver = metrics.tokens > 0 ? 100 - pctAdd - pctDel : 100;
  const tokenBar =
    metrics.tokens > 0
      ? `<div class="token-bar">
        <div class="add" style="flex:${pctAdd}">+${metrics.addTokens} add</div>
        <div class="del" style="flex:${pctDel}">-${metrics.delTokens} del</div>
        <div class="overhead" style="flex:${pctOver}">~${metrics.overheadTokens} ctx</div>
      </div>`
      : "";

  const tokenDetail = `<h3>Breakdown de tokens</h3>
    <table>
      <tr><th>Componente</th><th>Tokens</th><th>%</th></tr>
      <tr><td>Adições</td><td>+${metrics.addTokens}</td><td>${pctAdd}%</td></tr>
      <tr><td>Remoções</td><td>-${metrics.delTokens}</td><td>${pctDel}%</td></tr>
      <tr><td>Contexto (overhead)</td><td>~${metrics.overheadTokens}</td><td>${pctOver}%</td></tr>
      <tr><th>Total</th><th>~${metrics.tokens}</th><th>100%</th></tr>
    </table>`;

  const tableRowsHtml =
    tableRows.length > 0
      ? `<h3>Detalhamento por item</h3>
    <table>
      <tr>
        <th style="width:16%">Item</th>
        <th style="width:24%">Correção Efetuada</th>
        <th style="width:20%">Benefício</th>
        <th style="width:24%">Impacto no Negócio</th>
        <th style="width:16%">Custo Token</th>
      </tr>
      ${tableRows.map((r) => `<tr>
        <td><strong>${escapeHTML(r.item)}</strong></td>
        <td>${escapeHTML(r.fix)}</td>
        <td>${escapeHTML(r.benefit)}</td>
        <td>${escapeHTML(r.impact)}</td>
        <td><code>${escapeHTML(r.tokens)}</code></td>
      </tr>`).join("\n")}
    </table>`
      : "";

  // ── Apêndice técnico (slide 4) ─────────────────────────────────
  const defaultBefore = beforeText || `🧹 ${metrics.deletions} remoções — ${metrics.tokens > 0 ? `${metrics.lines} linhas tocadas` : "sem alterações"}`;
  const defaultAfter = afterText || `✨ ${metrics.additions} adições — ${fileList.length} arquivo(s) alterado(s)`;

  const appendixHtml = `
    <section class="slide appendix" id="s4">
      <div class="slide-head">
        <span class="slide-kicker">Apêndice técnico</span>
        <h2>Detalhes da implementação</h2>
      </div>
      <div class="appendix-grid">
        <div class="ap-card">
          <h3>✅ Checklist de revisão</h3>
          <ul class="checks">
            ${checks.map((c) => `<li>${c}</li>`).join("\n")}
          </ul>
        </div>
        <div class="ap-card">
          <h3>📸 Evidências — antes & depois</h3>
          <table>
            <tr><th>Item</th><th>Antes</th><th>Depois</th></tr>
            <tr><td><strong>Código</strong></td><td>${escapeHTML(defaultBefore)}</td><td>${escapeHTML(defaultAfter)}</td></tr>
          </table>
          ${evidenceUrl ? `<img src="${escapeHTML(evidenceUrl)}" alt="Evidência visual" class="evidence">` : ""}
        </div>
        <div class="ap-card">
          <h3>📊 Métricas da mudança</h3>
          <table>
            <tr><th>Métrica</th><th>Valor</th></tr>
            <tr><td>Arquivos alterados</td><td>${fileList.length}</td></tr>
            <tr><td>Adições</td><td>+${metrics.additions}</td></tr>
            <tr><td>Remoções</td><td>-${metrics.deletions}</td></tr>
            <tr><td>Tokens estimados</td><td>~${metrics.tokens}</td></tr>
          </table>
          ${tokenBar}
          ${tokenDetail}
        </div>
        <div class="ap-card">
          <h3>📁 Arquivos</h3>
          <table>
            <tr><th>Status</th><th>Arquivo</th></tr>
            ${filesTable}
          </table>
        </div>
      </div>
      ${tableRowsHtml ? `<div class="ap-card">${tableRowsHtml}</div>` : ""}
      <h3 class="diff-title">🔍 Diff (primeiras 120 linhas)</h3>
      <div class="diff">
        ${diff
          .split("\n")
          .slice(0, 120)
          .map((l) => {
            if (l.startsWith("+")) return `<span class="add">${escapeHTML(l)}</span>`;
            if (l.startsWith("-")) return `<span class="del">${escapeHTML(l)}</span>`;
            return escapeHTML(l);
          })
          .join("\n")}
      </div>
    </section>`;

  const slides = blufHtml + impactHtml + timelineSlide + appendixHtml;
  const slideCount = (slides.match(/class="slide"/g) || []).length;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${prefix} — ${escapeHTML(task)}</title>
  <style>
    :root{
      --bg:#0a0f1e;--bg2:#0d1526;--card:#111a2e;--card2:#16213a;--line:#1e2a44;
      --text:#e6edf7;--muted:#8fa3c0;--blue:#3b82f6;--green:#34d399;--amber:#fbbf24;--red:#f87171;--gold:#f59e0b;--teal:#2dd4bf;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%}
    body{
      font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
      background:radial-gradient(1200px 600px at 15% -10%,#12203f 0%,transparent 55%),radial-gradient(1000px 500px at 110% 20%,#0f2440 0%,transparent 50%),var(--bg);
      color:var(--text);line-height:1.55;-webkit-font-smoothing:antialiased;
    }
    .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    /* ── Deck ── */
    .deck{min-height:100vh;display:flex;flex-direction:column}
    .slide{
      flex:1 0 auto;min-height:100vh;padding:5.5rem clamp(1.25rem,5vw,4.5rem) 3.5rem;
      display:flex;flex-direction:column;justify-content:center;gap:1.4rem;
      max-width:1180px;margin:0 auto;width:100%;
      border-bottom:1px solid var(--line);
    }
    .deck-mode .slide{display:none}
    .deck-mode .slide.active{display:flex}
    /* ── Nav deck ── */
    .nav{
      position:fixed;top:1rem;right:1rem;z-index:60;display:flex;gap:.4rem;align-items:center;
      background:rgba(10,15,30,.85);backdrop-filter:blur(8px);border:1px solid var(--line);
      border-radius:999px;padding:.35rem .5rem;box-shadow:0 8px 24px rgba(0,0,0,.45);
    }
    .nav button{
      background:transparent;border:0;color:var(--muted);cursor:pointer;font-size:1.05rem;
      width:2.1rem;height:2.1rem;border-radius:999px;transition:all .15s;line-height:1;
    }
    .nav button:hover{background:var(--card2);color:var(--text)}
    .nav .count{font-size:.72rem;color:var(--muted);min-width:2.6rem;text-align:center;font-variant-numeric:tabular-nums}
    .nav .mode-btn{width:auto;padding:0 .7rem;font-size:.72rem;color:var(--muted)}
    /* ── Hero (slide 1) ── */
    .hero{display:flex;flex-direction:column;gap:.9rem}
    .hero-top{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}
    .hero-badges{display:flex;gap:.5rem;flex-wrap:wrap}
    .badge{
      display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .7rem;border-radius:999px;
      font-size:.72rem;font-weight:700;letter-spacing:.02em;border:1px solid var(--line);color:var(--muted);
    }
    .badge.pr{color:#93c5fd;border-color:rgba(59,130,246,.4);background:rgba(59,130,246,.12)}
    .badge.feat{color:#6ee7b7;border-color:rgba(52,211,153,.35);background:rgba(52,211,153,.1)}
    .badge.fix{color:#fca5a5;border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.1)}
    .badge.docs{color:#c4b5fd;border-color:rgba(167,139,250,.35);background:rgba(167,139,250,.1)}
    .badge.chore,.badge.auto{color:#a7b8d1;border-color:var(--line);background:rgba(255,255,255,.04)}
    .badge.risk{border-style:dashed}
    .badge.health{font-weight:800}
    .hero-date{font-size:.78rem;color:var(--muted)}
    h1{font-size:clamp(1.9rem,4.5vw,3.3rem);line-height:1.08;letter-spacing:-.03em;font-weight:800;text-wrap:balance}
    .hero-summary{font-size:clamp(1rem,1.6vw,1.3rem);color:var(--muted);max-width:62ch;text-wrap:balance}
    .hero-meta{font-size:.72rem;color:var(--muted);opacity:.8}
    /* ── KPI cards ── */
    .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.9rem;margin-top:.4rem}
    .kpi{
      background:linear-gradient(180deg,var(--card2),var(--card));border:1px solid var(--line);
      border-radius:1rem;padding:1.1rem 1.2rem;display:flex;flex-direction:column;gap:.2rem;
      box-shadow:0 10px 30px rgba(0,0,0,.3);
    }
    .kpi-value{font-size:clamp(1.9rem,3vw,2.6rem);font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--text)}
    .kpi-value.green{color:var(--green)}.kpi-value.amber{color:var(--amber)}
    .kpi-label{font-size:.8rem;color:var(--muted);font-weight:600}
    .kpi-sub{font-size:.7rem;color:var(--muted);opacity:.75}
    /* ── BLUF (one-pager) ── */
    .bluf{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.9rem}
    .bluf-col{background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:1rem;padding:1.1rem 1.2rem}
    .bluf-label{font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--blue);font-weight:800;margin-bottom:.4rem}
    .bluf-col p{font-size:.9rem;color:var(--text)}
    /* ── Slide head ── */
    .slide-head{display:flex;flex-direction:column;gap:.3rem;margin-bottom:.6rem}
    .slide-kicker{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;color:var(--blue);font-weight:800}
    .slide-head h2{font-size:clamp(1.4rem,3vw,2.1rem);letter-spacing:-.02em;font-weight:800}
    /* ── Impact grid ── */
    .impact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}
    .impact-card{background:linear-gradient(180deg,var(--card2),var(--card));border:1px solid var(--line);border-radius:1.2rem;padding:1.4rem;display:flex;flex-direction:column;gap:.5rem}
    .impact-icon{font-size:1.6rem}
    .impact-card h3{font-size:1rem;font-weight:800;letter-spacing:-.01em}
    .impact-card p{font-size:.9rem;color:var(--muted)}
    .impact-card.blue{border-top:3px solid var(--blue)}
    .impact-card.gold{border-top:3px solid var(--gold)}
    .impact-card.teal{border-top:3px solid var(--teal)}
    /* ── Timeline ── */
    .split{display:grid;grid-template-columns:1fr 1fr;gap:1.6rem;align-items:start}
    @media(max-width:760px){.split{grid-template-columns:1fr}}
    .timeline{position:relative;padding-left:1.4rem;display:flex;flex-direction:column;gap:1.05rem}
    .timeline::before{content:"";position:absolute;left:.4rem;top:.3rem;bottom:.3rem;width:2px;background:linear-gradient(180deg,var(--blue),var(--green))}
    .tl-item{position:relative;display:flex;align-items:center;gap:.9rem}
    .tl-dot{position:absolute;left:-1.4rem;width:.85rem;height:.85rem;border-radius:50%;background:var(--card);border:2px solid var(--blue)}
    .tl-item.pr\\:merge .tl-dot,.tl-item.pr-merge .tl-dot{border-color:var(--green);background:var(--green)}
    .tl-item.pre-pr .tl-dot{border-color:var(--amber)}
    .tl-body{display:flex;flex-direction:column}
    .tl-time{font-size:.68rem;color:var(--muted);font-variant-numeric:tabular-nums;font-weight:700}
    .tl-label{font-size:.92rem;font-weight:600}
    .tl-total{margin-top:.4rem;font-size:.85rem;color:var(--green);font-weight:700}
    .empty-note{font-size:.9rem;color:var(--muted);border:1px dashed var(--line);border-radius:1rem;padding:1.2rem}
    /* ── Stats ── */
    .stat-list{display:flex;flex-direction:column;gap:.8rem}
    .stat{background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:1rem 1.2rem;display:flex;align-items:baseline;gap:.9rem}
    .stat-v{font-size:1.7rem;font-weight:800;font-variant-numeric:tabular-nums;color:var(--blue)}
    .stat-v.green{color:var(--green)}
    .stat-l{font-size:.82rem;color:var(--muted)}
    /* ── Appendix ── */
    .appendix{justify-content:flex-start}
    .appendix-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media(max-width:860px){.appendix-grid{grid-template-columns:1fr}}
    .ap-card{background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:1.1rem 1.2rem}
    .ap-card h3{font-size:.92rem;font-weight:800;margin-bottom:.6rem}
    .checks{list-style:none;display:flex;flex-direction:column;gap:.35rem}
    .checks li{font-size:.85rem;color:var(--muted)}
    table{width:100%;border-collapse:collapse;font-size:.8rem}
    td,th{border:1px solid var(--line);padding:.45rem .6rem;text-align:left;vertical-align:top;color:var(--muted)}
    th{color:var(--text);font-weight:700;background:rgba(255,255,255,.04)}
    td code,code{color:#93c5fd;font-family:ui-monospace,Menlo,monospace;font-size:.78rem}
    .evidence{max-width:100%;border:1px solid var(--line);border-radius:.8rem;margin-top:.7rem}
    .token-bar{display:flex;border-radius:.6rem;overflow:hidden;margin:.7rem 0;font-size:.7rem}
    .token-bar div{padding:.3rem .7rem;text-align:center;white-space:nowrap}
    .token-bar .add{background:rgba(52,211,153,.18);color:#6ee7b7}
    .token-bar .del{background:rgba(248,113,113,.16);color:#fca5a5}
    .token-bar .overhead{background:rgba(255,255,255,.07);color:var(--muted)}
    .diff-title{margin:1.2rem 0 .5rem;font-size:.92rem;font-weight:800}
    .diff{background:#070b16;color:#c9d6ea;padding:.9rem;border-radius:.8rem;font:.74rem/1.5 ui-monospace,Menlo,monospace;overflow-x:auto;max-height:340px;border:1px solid var(--line)}
    .diff .add{color:#4ade80}
    .diff .del{color:#f87171}
    .foot{margin:1.4rem auto 2.5rem;text-align:center;font-size:.7rem;color:var(--muted);opacity:.6}
    .foot .scroll-hint{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:.3rem .9rem;margin-bottom:.8rem}
    /* ── Print (tema claro, one-pager + apêndice) ── */
    @media print{
      body{background:#fff;color:#111}
      .nav{display:none!important}
      .slide{min-height:0;page-break-after:always;display:flex!important;border-bottom:0;padding:1.5rem 0}
      .hero h1{color:#0b1220}
      .hero-summary,.hero-date,.hero-meta,.kpi-label,.kpi-sub,.bluf-col p,.impact-card p,.tl-time,.tl-label,.stat-l,.checks li,td,th,.foot{color:#334155}
      .kpi,.impact-card,.bluf-col,.ap-card,.stat{background:#fff;border-color:#e2e8f0;box-shadow:none}
      .bluf-col,.checks li{color:#334155}
      .diff{background:#f8fafc;color:#0f172a;border-color:#e2e8f0}
      .timeline::before{background:linear-gradient(180deg,#3b82f6,#16a34a)}
    }
  </style>
</head>
<body>
  <div class="nav" id="deckNav">
    <button id="prevBtn" title="Anterior (←)">←</button>
    <span class="count" id="slideCount">1/${slideCount}</span>
    <button id="nextBtn" title="Próxima (→)">→</button>
    <button id="fsBtn" title="Tela cheia (F)">⛶</button>
    <button id="printBtn" title="Imprimir / PDF (P)">⎙</button>
    <button class="mode-btn" id="modeBtn" title="Alternar modo documento">📄</button>
  </div>

  <div class="deck" id="deck">
    ${slides}
    <div class="foot">
      <div class="scroll-hint">Usa ← → (ou espaço) para navegar · F tela cheia · P imprime PDF · 📄 modo documento</div>
      Gerado por scripts/generate-report.mjs · ${date} ${time}
    </div>
  </div>

  <script>
    (function () {
      var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
      var deck = document.getElementById("deck");
      var count = document.getElementById("slideCount");
      var nav = document.getElementById("deckNav");
      var current = 0;
      var deckMode = true;

      function show(i) {
        current = Math.max(0, Math.min(slides.length - 1, i));
        slides.forEach(function (s, idx) {
          s.classList.toggle("active", idx === current);
        });
        count.textContent = (current + 1) + "/" + slides.length;
        if (deckMode) {
          window.scrollTo(0, 0);
        } else {
          slides[current].scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      function toggleMode() {
        deckMode = !deckMode;
        deck.classList.toggle("deck-mode", deckMode);
        document.body.classList.toggle("deck-mode", deckMode);
        nav.style.display = deckMode ? "flex" : "none";
        if (deckMode) show(current);
      }

      document.getElementById("nextBtn").addEventListener("click", function () { show(current + 1); });
      document.getElementById("prevBtn").addEventListener("click", function () { show(current - 1); });
      document.getElementById("fsBtn").addEventListener("click", function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      });
      document.getElementById("printBtn").addEventListener("click", function () { window.print(); });
      document.getElementById("modeBtn").addEventListener("click", toggleMode);

      document.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); show(current + 1); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); show(current - 1); }
        else if (e.key === "Home") { e.preventDefault(); show(0); }
        else if (e.key === "End") { e.preventDefault(); show(slides.length - 1); }
        else if (e.key === "f" || e.key === "F") {
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        }
        else if (e.key === "p" || e.key === "P") { window.print(); }
      });

      // Mobile/estreito: começa em modo documento (scroll) para não travar leitura
      if (window.innerWidth < 640) toggleMode();
      else { deck.classList.add("deck-mode"); document.body.classList.add("deck-mode"); show(0); }
    })();
  </script>
</body>
</html>`;
}

// ── Só executa o CLI quando chamado diretamente (permite import p/ testes) ──
const IS_MAIN =
  process.argv[1] &&
  fileURLToPath(pathToFileURL(resolve(process.argv[1])).href) === fileURLToPath(import.meta.url);

// ── Rename mode ──────────────────────────────────────────────────────
const RENAME_TARGET = IS_MAIN
  ? (() => {
      const idx = process.argv.indexOf("--rename");
      return idx !== -1 ? process.argv[idx + 1] || null : null;
    })()
  : null;
const RENAME_DATE = (() => {
  const idx = process.argv.indexOf("--date");
  return idx !== -1 ? process.argv[idx + 1] || null : null;
})();

if (IS_MAIN && RENAME_TARGET) {
  const renameDate = RENAME_DATE || new Date().toISOString().slice(0, 10);
  const renamePrefix = RENAME_TARGET.startsWith("PR") ? RENAME_TARGET : `PR${RENAME_TARGET}`;
  const dir = resolve(ROOT, `docs/reports/${renameDate}`);

  if (!existsSync(dir)) {
    console.log(`⚠️  Nenhum relatório encontrado em docs/reports/${renameDate}/`);
    process.exit(1);
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
  let renamed = 0;
  for (const file of files) {
    if (file.startsWith(renamePrefix)) continue; // já ok
    const newName = file.replace(/^[^-]+/, renamePrefix);
    if (newName === file) continue;
    renameSync(resolve(dir, file), resolve(dir, newName));
    console.log(`  🔄 ${file} → ${newName}`);
    renamed++;
  }
  if (renamed === 0) console.log(`  ✅ Todos os relatórios já com prefixo ${renamePrefix}`);
  else console.log(`  ✅ ${renamed} relatório(s) renomeado(s)`);
  process.exit(0);
}

// ── Main ─────────────────────────────────────────────────────────────

if (IS_MAIN) {
  const diff = getDiff();
  const changedFiles = getChangedFiles();
  const branch = getBranch();
  const commit = getCommit();
  const pr = getPR();
  const metrics = estimateTokens(diff);

  // Auto-métricas da sessão (telemetria do dia)
  const events = readTodayEvents();
  const quality = readTodayQuality();
  const session = computeSessionMetrics(
    events,
    quality,
    TESTS_FLAG ?? (process.env.REPORT_TESTS ? parseInt(process.env.REPORT_TESTS, 10) || null : null),
  );

  const html = generateHTML({
    task: TASK,
    diff,
    changedFiles,
    branch,
    commit,
    pr,
    metrics,
    tableRows: TABLE_ROWS,
    evidenceUrl: EVIDENCE_URL,
    beforeText: BEFORE_TEXT,
    afterText: AFTER_TEXT,
    summary: SUMMARY,
    impactProduto: IMPACT_PRODUTO,
    impactNegocio: IMPACT_NEGOCIO,
    impactoProcesso: IMPACT_PROCESSO,
    session,
  });

  if (SHOULD_WRITE) {
    const date = new Date().toISOString().slice(0, 10);
    const safeName = TASK.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const prefix = pr ? `PR${pr.number}` : PREFIX;
    const dir = resolve(ROOT, `docs/reports/${date}`);
    const filepath = resolve(dir, `${prefix}-${date}-${safeName}.html`);

    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(filepath, html);
    console.log(`✅ Relatório salvo: docs/reports/${date}/${prefix}-${date}-${safeName}.html`);
  } else {
    console.log(html);
  }
}
