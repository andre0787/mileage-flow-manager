#!/usr/bin/env node

/**
 * think.mjs — Captura ideias externas e registra em IDEIAS.md + docs/thoughts/.
 *
 * Uso:
 *   node scripts/think.mjs "ideia"                           # adiciona em IDEIAS.md Pendentes
 *   node scripts/think.mjs "ideia" --immediate               # + sugere council-to-superpowers
 *   node scripts/think.mjs "bug: descrição" --bug            # registra como bug aberto
 *
 * ponytail: fs + template, zero deps
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const NOW = new Date();
const DATE = NOW.toISOString().slice(0, 10);
const TIME = NOW.toTimeString().slice(0, 5);

const IDEA = process.argv[2];
if (!IDEA) {
  console.log([
    "Uso: node scripts/think.mjs \"ideia\" [--immediate|--bug]",
    "",
    "  --immediate   + sugere council-to-superpowers",
    "  --bug         registra como bug aberto em AGENDA.md",
    "",
    "Exemplos:",
    "  think.mjs \"adicionar export CSV em vendas\"",
    "  think.mjs \"refatorar login\" --immediate",
    "  think.mjs \"bug: saldo não atualiza após exclusão\" --bug",
  ].join("\n"));
  process.exit(0);
}

const MODE = process.argv.includes("--immediate") ? "immediate"
  : process.argv.includes("--bug") ? "bug"
  : "backlog";

const slug = IDEA.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

// ── 1. Salva em docs/thoughts/ ──────────────────────────────────────

const thoughtsDir = resolve(ROOT, "docs/thoughts");
if (!existsSync(thoughtsDir)) mkdirSync(thoughtsDir, { recursive: true });
const thoughtFile = resolve(thoughtsDir, `${DATE}-${slug}.md`);
const thought = [
  `# 💭 ${IDEA}`,
  `**Data:** ${DATE} ${TIME}`,
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
console.log(`📝 docs/thoughts/${DATE}-${slug}.md`);

// ── 2. Adiciona em IDEIAS.md ───────────────────────────────────────

const ideiasPath = resolve(ROOT, "docs/IDEIAS.md");
if (existsSync(ideiasPath)) {
  let ideias = readFileSync(ideiasPath, "utf8");
  const line = `- [ ] ${DATE}: ${IDEA}`;
  const idx = ideias.indexOf("## Pendentes");
  if (idx >= 0) {
    const afterHeader = ideias.indexOf("\n", idx) + 1;
    const nextSection = ideias.indexOf("\n## ", afterHeader);
    const insertAt = nextSection > afterHeader ? nextSection : ideias.length;
    ideias = ideias.slice(0, insertAt) + line + "\n" + ideias.slice(insertAt);
    writeFileSync(ideiasPath, ideias);
    console.log("💭 docs/IDEIAS.md → Pendentes");
  }
}

// ── 3. Se --bug, tb adiciona em AGENDA.md ──────────────────────────

if (MODE === "bug") {
  const agendaPath = resolve(ROOT, "docs/AGENDA.md");
  if (existsSync(agendaPath)) {
    let agenda = readFileSync(agendaPath, "utf8");
    const bugLine = `- [ ] ${DATE}: ${IDEA.replace(/^bug:\s*/i, "")}`;
    const abertosIdx = agenda.indexOf("### Abertos");
    if (abertosIdx >= 0) {
      const afterAbertos = agenda.indexOf("\n", abertosIdx) + 1;
      const noneBug = agenda.indexOf("_Nenhum bug aberto no momento._", abertosIdx);
      if (noneBug >= 0) {
        agenda = agenda.slice(0, noneBug) + bugLine + agenda.slice(agenda.indexOf("\n", noneBug) + 1);
      } else {
        const nextSection = agenda.indexOf("### ", afterAbertos);
        agenda = agenda.slice(0, nextSection) + bugLine + "\n" + agenda.slice(nextSection);
      }
      writeFileSync(agendaPath, agenda);
      console.log("🐞 AGENDA.md → Bugs Abertos");
    }
  }
}

// ── 4. Ações pós-registro ─────────────────────────────────────────

console.log("");
if (MODE === "immediate") {
  console.log("⚡ Modo imediato — próximo: council-to-superpowers (docs/WORKFLOW.md)");
} else if (MODE === "bug") {
  console.log("  Severidade: média (ajuste manual em AGENDA.md se necessário)");
  console.log("  Para resolver: branch fix/ → PR → CI → main");
} else {
  console.log("💡 Na próxima sessão o agente vai perguntar se quer consumir esta ideia.");
}

console.log(`\n✅ think.mjs concluído: ${MODE}`);
