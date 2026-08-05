#!/usr/bin/env node
/**
 * harness-check.mjs — CLI de verificação do harness de subagentes (P2).
 *
 * Uso:
 *   npm run harness:check            # relatório informativo (exit 0)
 *   npm run harness:check -- --check # exit 1 se o pacote estiver ausente
 *
 * Paths injetáveis por env (testes): PI_SETTINGS_PATH, PI_AGENTS_DIR.
 */

import { checkHarness, PACKAGE_NAME } from "./lib/harness-check.mjs";

const strict = process.argv.includes("--check");
const settingsPath = process.env.PI_SETTINGS_PATH;
const agentsDir = process.env.PI_AGENTS_DIR;

const { installed, agents, ok } = checkHarness(
  settingsPath || agentsDir ? { settingsPath, agentsDir } : {},
);

const lines = [];
lines.push("🔌 Harness de subagentes (pi-subagents):");
if (installed) {
  lines.push("  ✅ Pacote instalado no settings do pi.");
} else {
  lines.push("  ❌ Pacote NÃO instalado — delegação via subagent_gate falhará em pre-launch.");
  lines.push(`  ➜ Instale com: pi install npm:${PACKAGE_NAME}`);
  lines.push("  ➜ Depois reinicie a sessão do pi (extensão carrega no startup).");
}
lines.push(`  Agentes disponíveis (${agents.length}): ${agents.join(", ")}`);
if (!ok) {
  lines.push("  ⚠️  Use apenas agentes do catálogo acima — nomes fora dele são rejeitados no pre-launch (allowedAgents desde a 0.39.0).");
} else {
  lines.push("  ✅ OK — harness pronto para delegação.");
}
console.log(lines.join("\n"));

if (strict && !installed) {
  process.exit(1);
}
