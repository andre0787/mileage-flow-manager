#!/usr/bin/env node

/**
 * generate-report.mjs — Gera relatório HTML automático a partir do diff.
 *
 * Uso:
 *   node scripts/generate-report.mjs                          # preview no console
 *   node scripts/generate-report.mjs "Nome"                   # gera HTML
 *   node scripts/generate-report.mjs "Nome" --write           # salva em docs/reports/<data>/
 *   node scripts/generate-report.mjs "Nome" --prefix PR99     # prefixo custom (se nao houver PR)
 *   node scripts/generate-report.mjs "Nome" --benefits "linha1"  # beneficios
 *   node scripts/generate-report.mjs "Nome" --impact "Reduz suporte em 30%"  # impacto negocios
 *   node scripts/generate-report.mjs "Nome" --rows "Item|Fix|Beneficio|Impacto|~200"  # tabela detalhada
 *   node scripts/generate-report.mjs "Nome" --benefits "A" --impact "B" --rows "I|F|B|I|T" --write
 *
 * ponytail: template string + execSync, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, renameSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Help ───────────────────────────────────────────────────────────────
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Uso: node scripts/generate-report.mjs [descrição] [flags]

Flags:
  --write              Salva em docs/reports/<data>/
  --prefix <prefixo>   Prefixo (PR<num>, fix, feat, docs, chore, auto)
  --benefits <texto>   Benefícios da mudança
  --impact <texto>     Impacto no negócio
  --rows <linha>       Tabela: item|correção|benefício|impacto|token (múltiplo)
  --evidence <URL>     URL de screenshot como evidência visual
  --before <texto>     Descrição do estado anterior
  --after <texto>      Descrição do estado atual
  --rename PR<num>     Renomeia relatórios para prefixo PR<num>
  --date YYYY-MM-DD    Data para --rename (padrão: hoje)
  --help, -h           Mostra esta ajuda

Exemplos:
  npm run report "Corrigir overflow" --write
  npm run report "Feature X" --benefits "A" --impact "B" --rows "I|F|B|I|T" --write
  npm run report --rename PR103
  npm run report --rename 104 --date 2026-07-11
  npm run report:rename PR103
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

const BENEFITS = collectArgs("--benefits");
const BUSINESS_IMPACT = collectArgs("--impact");
const EVIDENCE_URL = collectArgs("--evidence");
const BEFORE_TEXT = collectArgs("--before");
const AFTER_TEXT = collectArgs("--after");

// Rows da tabela: pipe-separated: item|correcao|beneficio|impacto_negocio|custo_token
const TABLE_ROWS = (() => {
  const idx = process.argv.indexOf("--rows");
  if (idx === -1) return [];
  const rows = [];
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) break;
    const parts = process.argv[i].split("|").map(s => s.trim());
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

function escapeHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateHTML(task, diff, changedFiles, branch, commit, pr, metrics, benefits, businessImpact, tableRows, evidenceUrl, beforeText, afterText) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  const safeName = task.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const prefix = pr ? `PR${pr.number}` : PREFIX;
  const filename = `${prefix}-${date}-${safeName}.html`;

  const filesTable = changedFiles
    .split("\n")
    .filter(l => l.trim())
    .slice(0, 30)
    .map(l => {
      const [status, ...pathParts] = l.trim().split(/\s+/);
      const path = pathParts.join(" ");
      return `<tr><td>${status}</td><td>${path}</td></tr>`;
    })
    .join("\n");

  const prHtml = pr
    ? `<span class="badge pr">PR #${pr.number}</span>`
    : `<span class="badge auto">auto</span>`;

  // Badge de prefixo
  const prefixType = prefix.startsWith("fix") ? "fix"
    : prefix.startsWith("feat") ? "feat"
    : prefix.startsWith("docs") ? "docs"
    : prefix.startsWith("chore") ? "chore"
    : "auto";
  const prefixBadge = `<span class="badge ${prefixType}">${prefix}</span>`;

  // ── Nível de Risco (auto-detectado dos arquivos) ──────────────
  const fileList = changedFiles.split("\n").filter(l => l.trim());
  const filePaths = fileList.map(l => l.replace(/^\S+\s+/, ""));
  const hasMigration = filePaths.some(p => p.includes("migration") || p.includes("supabase/migrations"));
  const hasSchema = filePaths.some(p => p.includes("supabase-types") || p.includes("schema"));
  const hasCoreLib = filePaths.some(p => p.startsWith("src/lib/") && !p.includes("logger"));
  const hasHook = filePaths.some(p => p.startsWith("src/hooks/"));
  const hasComponent = filePaths.some(p => p.startsWith("src/components/"));
  const hasPage = filePaths.some(p => p.startsWith("src/pages/"));
  const hasOnlyDocs = filePaths.every(p => p.startsWith("docs/") || p.startsWith("scripts/") || p.startsWith(".pi/") || p.includes(".md"));
  const hasCI = filePaths.some(p => p.startsWith(".github/"));

  let riskLevel, riskColor, riskBg;
  if (hasMigration || hasSchema) {
    riskLevel = "Alto"; riskColor = "#991b1b"; riskBg = "#fee2e2";
  } else if (hasCoreLib || hasHook || hasCI) {
    riskLevel = "Médio"; riskColor = "#92400e"; riskBg = "#fef3c7";
  } else if (hasOnlyDocs) {
    riskLevel = "Baixo"; riskColor = "#166534"; riskBg = "#dcfce7";
  } else {
    riskLevel = "Médio"; riskColor = "#92400e"; riskBg = "#fef3c7";
  }
  const riskBadge = `<span class="badge" style="background:${riskBg};color:${riskColor}">${riskLevel} Risco</span>`;

  // ── Checklist automático ───────────────────────────────────────
  const checks = [];
  if (hasMigration || hasSchema) checks.push("🔷 Migração de banco aplicada?");
  if (hasComponent || hasPage) checks.push("🖼️ Renderização verificada em desktop e mobile?");
  if (hasHook) checks.push("🔌 Hooks testados em tela real?");
  if (hasCoreLib) checks.push("📦 Biblioteca testada com casos de borda?");
  if (filePaths.some(p => p.includes("FeedbackDialog") || p.includes("feedback"))) checks.push("📬 Feedback flow testado (anon + auth)?");
  if (filePaths.some(p => p.includes("logger"))) checks.push("📝 Logger testado (VITE_ENABLE_DEBUG_LOG)?");
  if (hasCI) checks.push("🤖 CI workflow válido? (sintaxe YAML)");
  if (filePaths.some(p => p.endsWith(".test.") || p.endsWith(".spec."))) checks.push("🧪 Testes existentes passam?");
  if (!filePaths.some(p => p.endsWith(".test.") || p.endsWith(".spec."))) checks.push("🧪 Testes manuais realizados?");
  checks.push("📋 Regras de validação passam? (npm run pre-pr)");

  const checklistHtml = `<h2>✅ Checklist de Revisão</h2>
    <ul>\n${checks.map(c => `      <li>${c}</li>`).join("\n")}\n    </ul>`;

  // Token bar
  const pctAdd = metrics.tokens > 0 ? Math.round(metrics.addTokens / metrics.tokens * 100) : 0;
  const pctDel = metrics.tokens > 0 ? Math.round(metrics.delTokens / metrics.tokens * 100) : 0;
  const pctOver = metrics.tokens > 0 ? 100 - pctAdd - pctDel : 100;
  const tokenBar = metrics.tokens > 0
    ? `<div class="token-bar">
        <div class="add" style="flex:${pctAdd}">+${metrics.addTokens} add</div>
        <div class="del" style="flex:${pctDel}">-${metrics.delTokens} del</div>
        <div class="overhead" style="flex:${pctOver}">~${metrics.overheadTokens} ctx</div>
       </div>`
    : "";

  // Impact section
  const impactHtml = businessImpact
    ? `<h2>🏢 Impacto no Negócio</h2>
       <div class="impact-box">${escapeHTML(businessImpact).replace(/\n/g, "<br>")}</div>
       <br>`
    : "";

  // ── Evidence section (sempre incluída) ──
  const defaultBefore = beforeText || `🧹 ${metrics.deletions} remoções — ${metrics.tokens > 0 ? `${metrics.lines} linhas tocadas` : "sem alterações"}`;
  const defaultAfter = afterText || `✨ ${metrics.additions} adições — ${fileList.length} arquivo(s) alterado(s)`;
  const evidenceHtml = `<h2>📸 Evidências — Antes & Depois</h2>
    <table>
      <tr><th style="width:15%">Item</th><th style="width:42%">Antes</th><th style="width:43%">Depois</th></tr>
      <tr>
        <td><strong>Código</strong></td>
        <td>${escapeHTML(defaultBefore)}</td>
        <td>${escapeHTML(defaultAfter)}</td>
      </tr>
      <tr>
        <td><strong>Arquivos</strong></td>
        <td colspan="2">${(() => {
          const files = changedFiles.split("\n").filter(l => l.trim());
          const groups = {};
          files.slice(0, 5).forEach(l => {
            const [s, ...p] = l.trim().split(/\s+/);
            const path = p.join(" ");
            if (!groups[s]) groups[s] = [];
            groups[s].push(path);
          });
          return Object.entries(groups).map(([s, paths]) => `<span style="color:${s === 'M' ? '#92400e' : s === 'A' ? '#166534' : s === 'D' ? '#991b1b' : '#666'};font-weight:600">${s === 'M' ? '✏️' : s === 'A' ? '➕' : s === 'D' ? '➖' : ''}</span> ${paths.join(', ')}`).join('<br>') + (files.length > 5 ? `<br><em>+${files.length - 5} arquivo(s)</em>` : '');
        })()}</td>
      </tr>
      ${evidenceUrl ? `<tr>
        <td><strong>📷 Screenshot</strong></td>
        <td colspan="2"><a href="${escapeHTML(evidenceUrl)}" target="_blank">${escapeHTML(evidenceUrl)}</a></td>
      </tr>` : ""}
      ${!beforeText && !afterText ? `<tr>
        <td><strong>💡 Dica</strong></td>
        <td colspan="2">Use <code>--before "descrição"</code> e <code>--after "descrição"</code> para texto customizado, ou <code>--evidence URL</code> pra screenshot</td>
      </tr>` : ""}
    </table>
    <br>`;

  // Token breakdown
  const tokenDetail = `<h3>Breakdown</h3>
    <table>
      <tr><th>Componente</th><th>Tokens</th><th>%</th></tr>
      <tr><td>Adições</td><td>+${metrics.addTokens}</td><td>${pctAdd}%</td></tr>
      <tr><td>Remoções</td><td>-${metrics.delTokens}</td><td>${pctDel}%</td></tr>
      <tr><td>Contexto (overhead)</td><td>~${metrics.overheadTokens}</td><td>${pctOver}%</td></tr>
      <tr><th>Total</th><th>~${metrics.tokens}</th><th>100%</th></tr>
    </table>`;

  // Final detailed table
  const tableRowsHtml = tableRows.length > 0
    ? `<h2>📋 Detalhamento por Item</h2>
    <table>
      <tr>
        <th style="width:18%">Item</th>
        <th style="width:22%">Correção Efetuada</th>
        <th style="width:20%">Benefício</th>
        <th style="width:22%">Impacto no Negócio</th>
        <th style="width:18%">Custo Token</th>
      </tr>
      ${tableRows.map(r => `<tr>
        <td><strong>${escapeHTML(r.item)}</strong></td>
        <td>${escapeHTML(r.fix)}</td>
        <td>${escapeHTML(r.benefit)}</td>
        <td>${escapeHTML(r.impact)}</td>
        <td><code>${escapeHTML(r.tokens)}</code></td>
      </tr>`).join("\n")}
    </table>
    <br>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${prefix} — ${escapeHTML(task)}</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;background:#fafafa;color:#1a1a1a}
    h1{font-size:1.3rem;border-bottom:2px solid #ddd;padding-bottom:.5rem}
    h2{font-size:1rem;margin-top:1.5rem;color:#333}
    h3{font-size:.9rem;margin-top:1.2rem;color:#555}
    .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600}
    .badge.pr{background:#dbeafe;color:#1e40af}
    .badge.auto{background:#fef3c7;color:#92400e}
    .badge.fix{background:#fee2e2;color:#991b1b}
    .badge.feat{background:#dcfce7;color:#166534}
    .badge.docs{background:#ede9fe;color:#5b21b6}
    .badge.chore{background:#f3f4f6;color:#374151}
    table{width:100%;border-collapse:collapse;font-size:.8rem;margin:.5rem 0}
    td,th{border:1px solid #ddd;padding:5px 8px;text-align:left;vertical-align:top}
    th{background:#f3f4f6;font-weight:600}
    tr.add{background:#f0fdf4}
    tr.del{background:#fef2f2}
    .meta{font-size:.8rem;color:#666;margin:.5rem 0}
    .token-bar{display:flex;gap:0;border-radius:4px;overflow:hidden;margin:.5rem 0;font-size:.75rem}
    .token-bar div{padding:3px 10px;text-align:center;white-space:nowrap}
    .token-bar .add{background:#dcfce7;color:#166534}
    .token-bar .del{background:#fee2e2;color:#991b1b}
    .token-bar .overhead{background:#f3f4f6;color:#374151}
    .diff{background:#1a1a1a;color:#e5e5e5;padding:.5rem;border-radius:4px;font:.75rem/1.4 'Courier New',monospace;overflow-x:auto;max-height:400px}
    .diff .add{color:#4ade80}
    .diff .del{color:#f87171}
    .impact-box{background:#f0f9ff;border-left:3px solid #3b82f6;padding:.75rem 1rem;border-radius:4px;margin:.5rem 0;font-size:.85rem}
    .center{text-align:center}
  </style>
</head>
<body>
  <h1>📋 ${escapeHTML(task)}</h1>
  <p class="meta">${date} ${time} &middot; ${branch} &middot; ${commit}</p>
  <p>${prHtml} ${prefixBadge} ${riskBadge}</p>

  <!-- Status cards -->
  <div style="display:flex;gap:1rem;flex-wrap:wrap;margin:.75rem 0">
    <div style="flex:1;min-width:120px;background:#f9fafb;border-radius:8px;padding:.5rem .75rem;text-align:center">
      <div style="font-size:1.5rem;font-weight:700">${fileList.length}</div>
      <div style="font-size:.7rem;color:#666">Arquivos</div>
    </div>
    <div style="flex:1;min-width:120px;background:#f0fdf4;border-radius:8px;padding:.5rem .75rem;text-align:center">
      <div style="font-size:1.5rem;font-weight:700;color:#166534">+${metrics.additions}</div>
      <div style="font-size:.7rem;color:#666">Adições</div>
    </div>
    <div style="flex:1;min-width:120px;background:#fef2f2;border-radius:8px;padding:.5rem .75rem;text-align:center">
      <div style="font-size:1.5rem;font-weight:700;color:#991b1b">-${metrics.deletions}</div>
      <div style="font-size:.7rem;color:#666">Remoções</div>
    </div>
    <div style="flex:1;min-width:120px;background:#fefce8;border-radius:8px;padding:.5rem .75rem;text-align:center">
      <div style="font-size:1.5rem;font-weight:700;color:#854d0e">~${metrics.tokens}</div>
      <div style="font-size:.7rem;color:#666">Tokens</div>
    </div>
  </div>

  ${checklistHtml}

  ${benefits ? `<h2>🎯 Benefícios</h2>
    <ul>
      ${benefits.split("\n").filter(l => l.trim()).map(l => `<li>${escapeHTML(l.replace(/^[\s*-]+/, ""))}</li>`).join("\n")}
    </ul>
    ` : ""}

  ${impactHtml}

  ${evidenceHtml}

  <h2>📊 Métricas</h2>
  <table>
    <tr><th>Métrica</th><th>Valor</th></tr>
    <tr><td>Arquivos alterados</td><td>${fileList.length}</td></tr>
    <tr><td>Adições</td><td>+${metrics.additions}</td></tr>
    <tr><td>Remoções</td><td>-${metrics.deletions}</td></tr>
    <tr><td>Tokens estimados</td><td>~${metrics.tokens}</td></tr>
  </table>

  <h2>⚡ Consumo de Tokens</h2>
  ${tokenBar}
  ${tokenDetail}

  <h2>📁 Arquivos</h2>
  <table>
    <tr><th>Status</th><th>Arquivo</th></tr>
    ${filesTable}
  </table>

  ${tableRowsHtml}

  <h2>🔍 Diff</h2>
  <div class="diff">
    ${diff.split("\n").slice(0, 120).map(l => {
      if (l.startsWith("+")) return `<span class="add">${escapeHTML(l)}</span>`;
      if (l.startsWith("-")) return `<span class="del">${escapeHTML(l)}</span>`;
      return escapeHTML(l);
    }).join("\n")}
  </div>

  <p class="meta center">Gerado por scripts/generate-report.mjs</p>
</body>
</html>`;
}

// ── Rename mode ──────────────────────────────────────────────────────
// node scripts/generate-report.mjs --rename PR<num> [--date YYYY-MM-DD]
const RENAME_TARGET = (() => {
  const idx = process.argv.indexOf("--rename");
  return idx !== -1 ? process.argv[idx + 1] || null : null;
})();
const RENAME_DATE = (() => {
  const idx = process.argv.indexOf("--date");
  return idx !== -1 ? process.argv[idx + 1] || null : null;
})();

if (RENAME_TARGET) {
  const renameDate = RENAME_DATE || new Date().toISOString().slice(0, 10);
  const renamePrefix = RENAME_TARGET.startsWith("PR") ? RENAME_TARGET : `PR${RENAME_TARGET}`;
  const dir = resolve(ROOT, `docs/reports/${renameDate}`);

  if (!existsSync(dir)) {
    console.log(`⚠️  Nenhum relatório encontrado em docs/reports/${renameDate}/`);
    process.exit(1);
  }

  const files = readdirSync(dir).filter(f => f.endsWith(".html"));
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

const diff = getDiff();
const changedFiles = getChangedFiles();
const branch = getBranch();
const commit = getCommit();
const pr = getPR();
const metrics = estimateTokens(diff);

const html = generateHTML(TASK, diff, changedFiles, branch, commit, pr, metrics, BENEFITS, BUSINESS_IMPACT, TABLE_ROWS, EVIDENCE_URL, BEFORE_TEXT, AFTER_TEXT);

if (SHOULD_WRITE) {
  const date = new Date().toISOString().slice(0, 10);
  const safeName = TASK.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const prefix = pr ? `PR${pr.number}` : PREFIX;
  const dir = resolve(ROOT, `docs/reports/${date}`);
  const filepath = resolve(dir, `${prefix}-${date}-${safeName}.html`);

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filepath, html);
  console.log(`✅ Relatório salvo: docs/reports/${date}/${prefix}-${date}-${safeName}.html`);
} else {
  console.log(html);
}
