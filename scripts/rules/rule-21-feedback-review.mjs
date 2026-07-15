#!/usr/bin/env node

/**
 * rule-21-feedback-review.mjs — Regra #21: Feedback de usuários revisado.
 *
 * Verifica se há feedbacks pendentes há mais de 7 dias sem resolução.
 * Se houver, exibe warning sugerindo revisão (não bloqueia o PR).
 *
 * Uso: node scripts/rules/rule-21-feedback-review.mjs
 * Exit: 0 = ok (warnings não bloqueiam)
 */

import { execSync } from "child_process";
import { ROOT } from "../lib.mjs";

try {
  const raw = execSync(
    `npx supabase db query --linked --output-format json "SELECT id, type, message, created_at FROM feedback WHERE status = 'new' AND created_at < now() - interval '7 days' ORDER BY created_at;" 2>/dev/null`,
    { cwd: ROOT, encoding: "utf8", timeout: 15000 },
  );

  const rows = JSON.parse(raw);
  if (!rows || rows.length === 0) {
    console.log("  ✅ Nenhum feedback pendente antigo.");
    process.exit(0);
  }

  console.log(`  ⚠️  ${rows.length} feedback(s) pendente(s) há mais de 7 dias:`);
  for (const r of rows) {
    const shortId = (r.id || "").slice(0, 8);
    const date = r.created_at ? r.created_at.slice(0, 10) : "?";
    console.log(`       [#${shortId}] ${r.message.slice(0, 80)} — ${date}`);
  }
  console.log("  💡 Revise em npm run feedback:check, resolva com npm run feedback:resolve <id>");
  process.exit(0);
} catch (e) {
  // DB offline — não bloqueia
  console.log("  ⏭️  feedback db offline");
  process.exit(0);
}
