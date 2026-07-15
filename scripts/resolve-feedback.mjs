#!/usr/bin/env node

/**
 * resolve-feedback.mjs — Marca um feedback como resolvido no banco.
 *
 * Uso: node scripts/resolve-feedback.mjs <id parcial ou completo>
 * Ex:  node scripts/resolve-feedback.mjs 0dd222ba
 *      node scripts/resolve-feedback.mjs 63e7372c "Corrigido: FeedbackDialog substituiu link direto pro GitHub"
 *
 * O script busca feedbacks cujo ID comece com o argumento, mostra opções,
 * e marca como 'done' com nota opcional.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { ROOT } from "./lib.mjs";

const AGENDA = resolve(ROOT, "docs/AGENDA.md");
const partialId = process.argv[2]?.toLowerCase();
const note = process.argv.slice(3).join(" ") || "Resolvido";

if (!partialId) {
  console.log("Uso: node scripts/resolve-feedback.mjs <id parcial> [nota]");
  console.log("Ex:  node scripts/resolve-feedback.mjs 0dd222ba");
  process.exit(1);
}

try {
  // Busca feedbacks que começam com o ID parcial
  const raw = execSync(
    `npx supabase db query --linked --output-format json "SELECT id, type, message, status, created_at FROM feedback WHERE id::text LIKE '${partialId}%' ORDER BY created_at;" 2>/dev/null`,
    { cwd: ROOT, encoding: "utf8", timeout: 15000 },
  );

  const rows = JSON.parse(raw);
  if (!rows || rows.length === 0) {
    console.log(`Nenhum feedback encontrado com id começando com "${partialId}"`);
    process.exit(1);
  }

  if (rows.length > 1) {
    console.log(`Múltiplos feedbacks encontrados para "${partialId}":`);
    for (const r of rows) {
      const shortId = (r.id || "").slice(0, 8);
      console.log(`  [${shortId}] ${r.type}: ${r.message.slice(0, 80)} (${r.status})`);
    }
    console.log("\nUse um ID mais específico.");
    process.exit(1);
  }

  const fb = rows[0];
  const shortId = (fb.id || "").slice(0, 8);

  if (fb.status === "done") {
    console.log(`Feedback #${shortId} já está como 'done'.`);
    process.exit(0);
  }

  // Marca como done (sem updated_at — a tabela feedback não tem essa coluna)
  execSync(
    `npx supabase db query --linked "UPDATE feedback SET status = 'done' WHERE id = '${fb.id}';" 2>/dev/null`,
    { cwd: ROOT, timeout: 30000 },
  );

  console.log(`✅ Feedback #${shortId} marcado como 'done'.`);
  console.log(`   "${fb.message.slice(0, 100)}"`);
  if (note) console.log(`   Nota: ${note}`);

  // Atualiza AGENDA.md removendo o item da lista de pendentes
  const agenda = readFileSync(AGENDA, "utf8");
  const escapedId = shortId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `- \\[.] 🐛 \`#${escapedId}\`.*?(?:\\n|$)` +  // feedback line
    `(?:.*?(?:\\n|$))*?(?=\\n- \\[.|\\n## )`,     // multi-line if needed
    "m"
  );

  // Simpler approach: find and remove just that line
  const linePattern = new RegExp(
    `- \\[[  ]\\] 🐛 \`#${escapedId}\`.*\\n?`,
    "m"
  );
  const updated = agenda.replace(linePattern, "");
  if (updated !== agenda) {
    writeFileSync(AGENDA, updated);
    console.log(`📝 AGENDA.md atualizado — item #${shortId} removido.`);
  }

} catch (e) {
  console.error("Erro ao resolver feedback:", e.message);
  process.exit(1);
}
