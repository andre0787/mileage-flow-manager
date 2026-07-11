#!/usr/bin/env node

/**
 * check-feedback.mjs — Verifica feedbacks de usuários pendentes
 * e alimenta a seção 📬 da AGENDA.md.
 *
 * Uso: node scripts/check-feedback.mjs
 *
 * ponytail: execSync + json output, zero deps
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const AGENDA = resolve(ROOT, "docs/AGENDA.md");

try {
  const raw = execSync(
    `npx supabase db query --linked --output-format json "SELECT id, type, message, email, created_at FROM feedback WHERE status = 'new' ORDER BY created_at;" 2>/dev/null`,
    { cwd: ROOT, encoding: "utf8", timeout: 15000 },
  );

  const rows = JSON.parse(raw);
  const count = rows?.length ?? 0;

  if (count === 0) {
    // Clear agenda section
    const agenda = readFileSync(AGENDA, "utf8");
    const updated = agenda.replace(
      /## 📬 Feedback de Usuários[\s\S]*?(?=\n## )/,
      "## 📬 Feedback de Usuários\n\n> Feedbacks reportados via formulário no app. Revisar no início da sessão.\n> Alimentam o backlog futuro e correções de bugs.\n\n_Nenhum feedback pendente._\n\n"
    );
    writeFileSync(AGENDA, updated);
    console.log("📬 Feedback: nenhum pendente ✅");
    process.exit(0);
  }

  // Build agenda section
  const items = rows.map(r => {
    const icon = r.type === "bug" ? "🐛" : "💡";
    const email = r.email ? ` (${r.email})` : "";
    const date = r.created_at ? r.created_at.slice(0, 10) : "";
    const shortId = r.id ? r.id.slice(0, 8) : "";
    return `- [ ] ${icon} \`#${shortId}\` ${r.message}${email} — ${date}`;
  }).join("\n");

  const section = `## 📬 Feedback de Usuários\n\n> Feedbacks reportados via formulário no app. Revisar no início da sessão.\n> Alimentam o backlog futuro e correções de bugs.\n\n${items}\n\n`;

  // Update AGENDA.md
  const agenda = readFileSync(AGENDA, "utf8");
  let updated;
  if (agenda.includes("## 📬 Feedback de Usuários")) {
    updated = agenda.replace(
      /## 📬 Feedback de Usuários[\s\S]*?(?=\n## )/,
      section
    );
  } else {
    updated = agenda.replace(
      /(## 📌 Backlog Futuro)/,
      `${section}$1`
    );
  }
  writeFileSync(AGENDA, updated);

  // Print to console
  console.log(`📬 Feedback: ${count} pendente(s)`);
  for (const r of rows) {
    const shortId = r.id ? r.id.slice(0, 8) : "";
    const icon = r.type === "bug" ? "🐛" : "💡";
    const email = r.email ? ` (${r.email})` : "";
    console.log(`  ${icon} [#${shortId}] ${r.message}${email}`);
  }
  console.log("  → npm run feedback:review  p/ detalhes");
} catch (e) {
  console.log("📬 Feedback: erro ao consultar (db offline?)", e.message);
}
