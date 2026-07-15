#!/usr/bin/env node

/**
 * rule-22-pr-naming.mjs — Valida nomenclatura de PRs.
 *
 * Padrões aceitos (da convenção do projeto):
 *   <fix|feat|chore|docs>: <descrição>
 *   <fix|feat|chore|docs>: <escopo> — <descrição>
 *   Sprint <letra> — <descrição>
 *
 * Uso:
 *   node scripts/rules/rule-22-pr-naming.mjs              # valida PR da branch atual
 *   node scripts/rules/rule-22-pr-naming.mjs --title "..." # valida título específico
 *
 * Exit code: 0 se válido, 1 se inválido.
 *
 * ponytail: regex + match, zero deps.
 */

const VALID_TYPES = ["sprint", "fix", "feat", "chore", "docs"];

function validateTitle(title) {
  const errors = [];

  if (!title || title.trim().length === 0) {
    return { valid: false, errors: ["Título vazio"] };
  }

  const trimmed = title.trim();

  // Padrão 1: <tipo>: <descrição>
  //   ex: "fix: corrige cache invalidation"
  //   ex: "feat: refino de design — sparklines..."
  const typeDescMatch = /^(fix|feat|chore|docs):\s+(.+)$/i.exec(trimmed);

  // Padrão 2: Sprint <letra> — <descrição>
  //   ex: "Sprint B + C — Limpeza & Confiabilidade"
  const sprintMatch = /^Sprint\s+(\S+)\s+[—–-]\s+(.+)$/i.exec(trimmed);

  // Padrão 3: Sprint <letra>: <descrição>
  const sprintColonMatch = /^Sprint\s+(\S+):\s+(.+)$/i.exec(trimmed);

  // Extrai tipo e descrição
  let type = null;
  let desc = null;

  if (typeDescMatch) {
    type = typeDescMatch[1].toLowerCase();
    desc = typeDescMatch[2];
  } else if (sprintMatch) {
    type = "sprint";
    desc = sprintMatch[2];
  } else if (sprintColonMatch) {
    type = "sprint";
    desc = sprintColonMatch[2];
  } else {
    errors.push("Título não segue padrão. Esperado: <fix|feat|chore|docs>: <descrição> ou Sprint <letra> — <descrição>");
    errors.push(`  Ex: "fix: corrige bug no formulário"`);
    errors.push(`  Ex: "Sprint B — Limpeza & Confiabilidade"`);
    return { valid: false, errors };
  }

  // Valida descrição
  if (desc && desc.length > 80) {
    errors.push(`Descrição muito longa: ${desc.length} caracteres (máx 80)`);
  }

  return { valid: errors.length === 0, errors };
}

// ── Main ──
const titleIdx = process.argv.indexOf("--title");
const rawTitle = titleIdx !== -1 ? process.argv[titleIdx + 1] : null;

async function getCurrentPRTitle() {
  try {
    const { execSync } = await import("child_process");
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
    const out = execSync(`gh pr list --head "${branch}" --json title --jq '.[0].title' 2>/dev/null`, {
      encoding: "utf8",
      timeout: 5_000,
    }).trim();
    return out === "null" || out === "" ? null : out;
  } catch {
    return null;
  }
}

async function main() {
  const title = rawTitle || await getCurrentPRTitle();

  if (!title) {
    console.log("  ⏭️  Nenhum PR encontrado para esta branch — pulando validação de título");
    process.exit(0);
  }

  const result = validateTitle(title);

  if (result.valid) {
    console.log(`  ✅ Título do PR válido: "${title}"`);
    process.exit(0);
  } else {
    console.log(`  ❌ Título do PR inválido: "${title}"`);
    result.errors.forEach(e => console.log(`     • ${e}`));
    console.log(`     Esperado: <${VALID_TYPES.join("|")}> [escopo] — descrição`);
    process.exit(1);
  }
}

main();
