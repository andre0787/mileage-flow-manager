#!/usr/bin/env node

/**
 * think.mjs — Captura uma ideia externa e integra no workflow do projeto.
 *
 * Uso:
 *   node scripts/think.mjs "adicionar dark mode no dashboard"              # registra no backlog
 *   node scripts/think.mjs "refatorar X" --immediate                       # + council-to-superpowers
 *   node scripts/think.mjs "bug: Y quebra quando Z" --bug                  # registra como bug
 *
 * Fluxo:
 *   1. Captura ideia → registra em docs/thoughts/<data>-<slug>.md
 *   2. Se --bug: adiciona em AGENDA.md → 🐞 Bugs Encontrados → Abertos
 *   3. Se --immediate: sugere council-to-superpowers
 *   4. Padrão: adiciona em AGENDA.md → 📌 Backlog Futuro
 *
 * ponytail: fs + template string, zero deps
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const IDEA = process.argv[2];
if (!IDEA) {
  console.log([
    "Uso: node scripts/think.mjs \"ideia\" [--immediate|--bug]",
    "",
    "  --immediate   sugestão de council-to-superpowers",
    "  --bug         registra como bug aberto",
    "",
    "Exemplos:",
    "  think.mjs \"adicionar export CSV em vendas\"",
    "  think.mjs \"refatorar login\" --immediate",
    "  think.mjs \"bug: saldo não atualiza após exclusão\" --bug",
  ].join("\n"));
  process.exit(0);
}

const now = new Date();
const date = now.toISOString().slice(0, 10);
const time = now.toTimeString().slice(0, 5);
const slug = IDEA.toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 60);

const MODE = process.argv.includes("--immediate") ? "immediate"
  : process.argv.includes("--bug") ? "bug"
  : "backlog";

// ── 1. Salva em docs/thoughts/ ──────────────────────────────────────

const thoughtsDir = resolve(ROOT, "docs/thoughts");
if (!existsSync(thoughtsDir)) mkdirSync(thoughtsDir, { recursive: true });

const thoughtFile = resolve(thoughtsDir, `${date}-${slug}.md`);
const thought = [
  `# 💭 ${IDEA}`,
  `**Data:** ${date} ${time}`,
  `**Modo:** ${MODE}`,
  "",
  "## Ideia",
  "",
  IDEA,
  "",
  "## Anotações",
  "",
  "(espaço para análise posterior)",
  "",
  "---",
  "_Gerado por scripts/think.mjs_",
].join("\n");
writeFileSync(thoughtFile, thought);
console.log(`📝 Ideia registrada: docs/thoughts/${date}-${slug}.md`);

// ── 2. Se --bug, adiciona em AGENDA.md ──────────────────────────────

if (MODE === "bug") {
  const agendaPath = resolve(ROOT, "docs/AGENDA.md");
  if (existsSync(agendaPath)) {
    let agenda = readFileSync(agendaPath, "utf8");
    const bugLine = `- [ ] ${date}: ${IDEA.replace(/^bug:\s*/i, "")}`;
    // Adiciona depois de "### Abertos" e antes de "_Nenhum bug aberto_"
    const abertosIdx = agenda.indexOf("### Abertos");
    if (abertosIdx >= 0) {
      const afterAbertos = agenda.indexOf("\n", abertosIdx) + 1;
      const nextSection = agenda.indexOf("### ", afterAbertos);
      const insertAt = nextSection > afterAbertos ? nextSection : agenda.length;
      // Se tem "_Nenhum bug aberto_", substitui pela entrada
      const noneBug = agenda.indexOf("_Nenhum bug aberto no momento._", abertosIdx);
      if (noneBug >= 0 && noneBug < insertAt) {
        agenda = agenda.slice(0, noneBug) + bugLine + agenda.slice(agenda.indexOf("\n", noneBug) + 1);
      } else {
        agenda = agenda.slice(0, insertAt) + bugLine + "\n" + agenda.slice(insertAt);
      }
      writeFileSync(agendaPath, agenda);
      console.log("🐞 Bug adicionado em AGENDA.md → 🐞 Bugs Encontrados → Abertos");
    }
  }
}

// ── 3. Se backlog, adiciona em AGENDA.md ────────────────────────────

if (MODE === "backlog") {
  const agendaPath = resolve(ROOT, "docs/AGENDA.md");
  if (existsSync(agendaPath)) {
    let agenda = readFileSync(agendaPath, "utf8");
    const backlogLine = `- [ ] ${IDEA}`;
    const backlogIdx = agenda.indexOf("## 📌 Backlog Futuro");
    if (backlogIdx >= 0) {
      const afterBacklog = agenda.indexOf("\n", backlogIdx) + 1;
      // Próximo separador --- antes da próxima seção raiz
      const sep = agenda.indexOf("\n---\n", afterBacklog);
      const insertAt = sep > afterBacklog ? sep + 1 : agenda.length;
      agenda = agenda.slice(0, insertAt) + backlogLine + "\n" + agenda.slice(insertAt);
      writeFileSync(agendaPath, agenda);
      console.log("📌 Ideia adicionada em AGENDA.md → 📌 Backlog Futuro");
    }
  }
}

// ── 4. Ações pós-registro ───────────────────────────────────────────

console.log("");
if (MODE === "immediate") {
  console.log("⚡ Modo imediato ativado.");
  console.log("  Próximo passo sugerido: rodar council-to-superpowers");
  console.log("  (veja docs/WORKFLOW.md para o fluxo completo)");
} else if (MODE === "bug") {
  console.log("  Severidade padrão: média. Ajuste manualmente em AGENDA.md se necessário.");
  console.log("  Para resolver: crie branch fix/ + PR.");
} else {
  console.log("  A ideia está no backlog. Para remanejar para sprint ativa, mova manualmente.");
}

console.log(`\n✅ think.mjs concluído: ${MODE}`);
