#!/usr/bin/env node

/**
 * rule-47-mcp-bridge.mjs — Regra #47 (MCP Bridge)
 *
 * Interface com Model Context Protocol documentada e versionada:
 * - HARD FAIL: `.pi/extensions/mcp-bridge.ts` ausente — a interface MCP deve
 *   existir versionada no repo (mesmo contrato da rule-37 com rtk.ts).
 * - INFO (não bloqueia): presença de config MCP (`SERENA_MCP_URL` ou `.mcp.json`).
 *
 * Regra #47: "Interface MCP documentada e versionada: config (SERENA_MCP_URL /
 * .mcp.json) ou skill/script presente; extensão mcp-bridge em .pi/extensions/."
 *
 * Uso: node scripts/rules/rule-47-mcp-bridge.mjs
 * Env: MOCK_ROOT (fixtures de teste)
 */

import { existsSync } from "fs";
import { resolve } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "../..");
const EXT_PATH = resolve(ROOT, ".pi/extensions/mcp-bridge.ts");

function main() {
  if (!existsSync(EXT_PATH)) {
    console.error(
      "❌ rule-47: .pi/extensions/mcp-bridge.ts ausente — versione a interface MCP (contrato da rule-37)",
    );
    process.exit(1);
  }
  console.log("  ✅ rule-47: extensão mcp-bridge versionada (.pi/extensions/mcp-bridge.ts)");

  if (process.env.SERENA_MCP_URL) {
    console.log("  ℹ️  rule-47: SERENA_MCP_URL definido — bridge MCP ativa");
  } else if (existsSync(resolve(ROOT, ".mcp.json"))) {
    console.log("  ℹ️  rule-47: .mcp.json presente — config MCP do projeto");
  } else {
    console.log("  ℹ️  rule-47: sem config MCP externa (SERENA_MCP_URL/.mcp.json) — bridge documental");
  }
  console.log("  ✅ rule-47: mcp bridge ok");
}

main();
