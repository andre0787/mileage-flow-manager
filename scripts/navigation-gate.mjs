#!/usr/bin/env node

/**
 * navigation-gate.mjs — Gate de decisão de navegação estrutural.
 *
 * Decide qual ferramenta de navegação usar no ambiente atual:
 *   1. code-review-graph (CRG) — padrão no pi (CLI via pipx)
 *   2. serena — fallback quando o MCP estiver disponível (SERENA_MCP_URL)
 *   3. grep — fallback genérico (grep -rn + read com offset/limit)
 *
 * Uso:
 *   node scripts/navigation-gate.mjs            # saída humana
 *   node scripts/navigation-gate.mjs --json     # saída JSON parseável
 *   node scripts/navigation-gate.mjs --force crg|serena|grep  # override (testes)
 *
 * Exit codes: 0 = decidido; 1 = erro de uso (--force inválido).
 *
 * ponytail: node: built-ins, zero deps. Read-only: executa apenas
 * `code-review-graph --version` para detecção.
 */

import { execSync } from "node:child_process";

const CRG_BIN = process.env.CRG_BIN || "code-review-graph";

const TOOLS = new Set(["crg", "serena", "grep"]);

const RECOMMENDED = {
  crg: [
    "code-review-graph architecture",
    "code-review-graph query --help",
    "code-review-graph impact",
  ],
  serena: ["serena_get_symbols_overview", "serena_find_symbol"],
  grep: ["grep -rn '<simbolo>' src/", "read com offset/limit (ler só o trecho necessário)"],
};

function detectCrg() {
  try {
    execSync(`${CRG_BIN} --version`, { stdio: "pipe", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function detectSerena() {
  return Boolean(process.env.SERENA_MCP_URL && process.env.SERENA_MCP_URL.trim() !== "");
}

function decide(forced) {
  const available = { crg: detectCrg(), serena: detectSerena() };

  if (forced) {
    if (!TOOLS.has(forced)) {
      console.error(`❌ --force inválido: "${forced}". Use um de: ${[...TOOLS].join(", ")}`);
      process.exit(1);
    }
    return { tool: forced, available };
  }

  if (available.crg) return { tool: "crg", available };
  if (available.serena) return { tool: "serena", available };
  return { tool: "grep", available };
}

function reason(tool, available) {
  switch (tool) {
    case "crg":
      return "code-review-graph disponível (CLI via pipx, sem MCP) — navegador estrutural padrão no pi";
    case "serena":
      return "serena MCP disponível (SERENA_MCP_URL definido)";
    default:
      return available.crg || available.serena
        ? "fallback genérico (grep + read parcial)"
        : "nenhuma ferramenta estrutural detectada — fallback grep + read parcial";
  }
}

function printHuman(decision) {
  const { tool, available } = decision;
  console.log(`🛰️ Navegação: ${tool}`);
  console.log(`Razão: ${reason(tool, available)}`);
  console.log("");
  console.log("Comandos recomendados:");
  for (const cmd of RECOMMENDED[tool]) {
    console.log(`  - ${cmd}`);
  }
  if (tool !== "grep") {
    console.log("  - grep -rn '<simbolo>' src/ (fallback pontual)");
  }
}

function main() {
  const args = process.argv.slice(2);
  let forced = null;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json") json = true;
    else if (args[i] === "--force" && args[i + 1]) {
      forced = args[++i];
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log("Uso: node scripts/navigation-gate.mjs [--json] [--force crg|serena|grep]");
      process.exit(0);
    }
  }

  const decision = decide(forced);

  if (json) {
    console.log(JSON.stringify({
      tool: decision.tool,
      reason: reason(decision.tool, decision.available),
      available: decision.available,
    }, null, 2));
  } else {
    printHuman(decision);
  }

  process.exit(0);
}

main();
