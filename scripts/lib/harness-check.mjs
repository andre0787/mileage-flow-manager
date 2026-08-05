/**
 * harness-check.mjs — Guard preventivo do harness de subagentes (P2).
 *
 * Verifica se o pacote `pi-subagents` está instalado (settings do pi) e quais
 * agentes estão disponíveis no catálogo. Objetivo: falhar rápido com mensagem
 * acionável ANTES de tentar delegar via subagent_gate — evita acumular
 * `failureKind: "subagent_prelaunch"` no KPI quando o responder está ausente.
 *
 * Read-only: nunca escreve, instala ou altera configuração.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const PACKAGE_NAME = "pi-subagents";
export const DEFAULT_SETTINGS_PATH = join(homedir(), ".pi", "agent", "settings.json");
export const DEFAULT_AGENTS_DIR = join(
  homedir(),
  ".pi",
  "agent",
  "npm",
  "node_modules",
  "pi-subagents",
  "agents",
);

/**
 * Catálogo de agentes builtin do pi-subagents (v0.39+). Usado como fallback
 * informativo quando o pacote não está instalado — a partir da 0.39.0 o
 * harness valida agentes no pre-launch (allowedAgents), então delegar com
 * nomes fora deste catálogo falha com `subagent_prelaunch`.
 */
export const BUILTIN_AGENTS = [
  "advisor",
  "context-builder",
  "delegate",
  "oracle",
  "planner",
  "researcher",
  "reviewer",
  "scout",
  "worker",
];

/**
 * Verifica o harness de subagentes.
 *
 * @param {object} opts Paths injetáveis (testabilidade).
 * @param {string} [opts.settingsPath] Caminho do settings.json do pi.
 * @param {string} [opts.agentsDir] Diretório de agentes do pacote instalado.
 * @returns {{ installed: boolean, agents: string[], ok: boolean }}
 */
export function checkHarness({
  settingsPath = DEFAULT_SETTINGS_PATH,
  agentsDir = DEFAULT_AGENTS_DIR,
} = {}) {
  const installed = isPackageInstalled(settingsPath);
  const agents = listAgents(agentsDir);
  return { installed, agents, ok: installed && agents.length > 0 };
}

/** true quando settings.json contém `pi-subagents` na lista `packages`. */
export function isPackageInstalled(settingsPath) {
  if (!existsSync(settingsPath)) return false;
  try {
    const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    const packages = Array.isArray(settings?.packages) ? settings.packages : [];
    return packages.some(
      (p) => typeof p === "string" && p.includes(PACKAGE_NAME),
    );
  } catch {
    return false;
  }
}

/**
 * Lista os agentes do diretório do pacote (arquivos .md = agentes).
 * Se o diretório não existir (pacote ausente), retorna o catálogo builtin
 * como referência para a mensagem acionável.
 */
export function listAgents(agentsDir) {
  if (!existsSync(agentsDir)) return [...BUILTIN_AGENTS];
  try {
    return readdirSync(agentsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
      .sort();
  } catch {
    return [...BUILTIN_AGENTS];
  }
}
