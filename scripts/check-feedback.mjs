#!/usr/bin/env node

/**
 * check-feedback.mjs — Verifica feedbacks de usuários (pendentes + resolvidos)
 * e atualiza a seção 📬 da AGENDA.md.
 *
 * Uso: node scripts/check-feedback.mjs
 *
 * ponytail: execSync + supabase CLI, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { ROOT } from "./lib.mjs";
import { resolve } from "path";

const AGENDA = resolve(ROOT, "docs/AGENDA.md");

function query(sql) {
  return execSync(
    `npx supabase db query --linked --output-format json "${sql}" 2>/dev/null`,
    { cwd: ROOT, encoding: "utf8", timeout: 15000 },
  );
}

function formatItem(r) {
  const icon = r.type === "bug" ? "🐛" : "💡";
  const shortId = r.id ? r.id.slice(0, 8) : "";
  const email = r.email ? ` (${r.email})` : "";
  const date = r.created_at ? r.created_at.slice(0, 10) : "";
  const logs = r.logs ? " 📋logs" : "";
  return `- [ ] ${icon} \`#${shortId}\` ${r.message}${email}${logs} — ${date}`;
}

try {
  // Feedbacks pendentes (status = 'new')
  let pendingRaw = [];
  try {
    pendingRaw = JSON.parse(query(
      "SELECT id, type, message, email, logs, created_at FROM feedback WHERE status = 'new' ORDER BY created_at;"
    ));
  } catch { /* no results */ }
  const pending = pendingRaw ?? [];
  const pendingCount = pending.length;

  // Feedbacks resolvidos (últimos 10)
  let doneRaw = [];
  try {
    doneRaw = JSON.parse(query(
      `SELECT id, type, message, email, logs, created_at FROM feedback WHERE status = 'done' ORDER BY created_at DESC LIMIT 10;`
    ));
  } catch { /* no results */ }
  const doneFb = doneRaw ?? [];
  const doneCount = doneFb.length;

  // Monta seções
  let pendingSection = "";
  if (pendingCount > 0) {
    pendingSection = pending.map(formatItem).join("\n") + "\n\n";
  } else {
    pendingSection = "_Nenhum feedback pendente._\n\n";
  }

  let doneSection = "";
  if (doneCount > 0) {
    doneSection = "### ✅ Resolvidos\n\n" +
      doneFb.map(r => {
        const shortId = r.id ? r.id.slice(0, 8) : "";
        const date = r.created_at ? r.created_at.slice(0, 10) : "";
        return `- ✅ \`#${shortId}\` ${r.message} — ${date}`;
      }).join("\n") + "\n\n";
  }

  const fullSection = `## 📬 Feedback de Usuários

> Feedbacks reportados via formulário no app. Revisar no início da sessão.
> Alimentam o backlog futuro e correções de bugs.

### 🔴 Pendentes (${pendingCount})

${pendingSection}${doneSection}`;

  // Atualiza AGENDA.md
  const agenda = readFileSync(AGENDA, "utf8");
  const updated = agenda.includes("## 📬 Feedback de Usuários")
    ? agenda.replace(/## 📬 Feedback de Usuários[\s\S]*?(?=\n## )/, fullSection)
    : agenda.replace(/(## 📌 Backlog Futuro)/, `${fullSection}$1`);
  writeFileSync(AGENDA, updated);

  // Resumo no console
  console.log(`📬 Feedback: ${pendingCount} pendente(s), ${doneCount} resolvido(s) recente(s)`);
  for (const r of pending) {
    const icon = r.type === "bug" ? "🐛" : "💡";
    const shortId = r.id ? r.id.slice(0, 8) : "";
    console.log(`  ${icon} [#${shortId}] ${r.message}${r.email ? ` (${r.email})` : ""}`);
  }
  if (doneCount > 0) {
    console.log(`\n  ✅ Resolvidos:`);
    for (const r of doneFb) {
      const shortId = r.id ? r.id.slice(0, 8) : "";
      console.log(`    [#${shortId}] ${r.message}`);
    }
  }
} catch (e) {
  console.log("📬 Feedback: erro ao consultar (db offline?)", e.message);
}
