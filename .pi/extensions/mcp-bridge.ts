// MCP Bridge — pi extension (Blueprint v9.0, rule-47).
//
// Interface com o Model Context Protocol documentada e versionada.
// Ativação: inicialização. Diagnósticos em stderr (fail-open).
//
// Contrato:
//   - Descobre config MCP externa: SERENA_MCP_URL (ex: VS Code) ou .mcp.json.
//   - Quando ativa, o agente pode usar ferramentas MCP (serena_get_* etc.).
//   - Sem servidor MCP externo, a bridge permanece documental — nunca bloqueia.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

function note(msg: string) {
  process.stderr.write(`[mcp-bridge] ${msg}\n`)
}

export default async function (pi: ExtensionAPI) {
  try {
    const serenaUrl = process.env.SERENA_MCP_URL
    const mcpConfig = resolve(process.cwd(), ".mcp.json")

    if (serenaUrl) {
      note(`MCP ativa via SERENA_MCP_URL (${serenaUrl})`)
    } else if (existsSync(mcpConfig)) {
      note("MCP ativa via .mcp.json")
    } else {
      note("sem config MCP externa (SERENA_MCP_URL/.mcp.json) — bridge documental")
    }
  } catch (err) {
    note(`desativada (fail-open): ${String(err)}`)
  }
}
