// Token Sentinel — pi extension (Blueprint v9.0, rule-46).
//
// Higiene de contexto e persistência de sessão entre turnos de IA.
// Ativação: inicialização da sessão. Diagnósticos em stderr (fail-open,
// sem console.* no diff — rule-30). Nunca bloqueia execução.
//
// Contrato:
//   - Exige docs/AI-SESSION-STATE.md (estrutura do Blueprint v9.0) como
//     protocolo de transferência entre agentes.
//   - Lembra o checklist de check-in (rule-46): arquivos src/ >150 linhas
//     são cobertos pela rule-41; poda ≥20% de ruído é diretriz subjetiva.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

function note(msg: string) {
  process.stderr.write(`[token-sentinel] ${msg}\n`)
}

export default async function (pi: ExtensionAPI) {
  try {
    const statePath = resolve(process.cwd(), "docs/AI-SESSION-STATE.md")
    if (!existsSync(statePath)) {
      note("docs/AI-SESSION-STATE.md ausente — atualize o protocolo de persistência (rule-46)")
      return
    }

    const content = readFileSync(statePath, "utf8")
    const sections = [
      "## Última Task",
      "## Estado dos Testes & Qualidade",
      "## Arquivos Modificados & Impacto",
      "## Pendências Imediatas",
      "## Governança de Contexto",
    ]
    const missing = sections.filter((s) => !content.includes(s))
    if (missing.length > 0) {
      note(`AI-SESSION-STATE.md sem seções obrigatórias: ${missing.join(", ")}`)
      return
    }

    const lines = content.split("\n").length
    note(`context state ok (${lines} linhas; limite 50)`)
  } catch (err) {
    note(`desativada (fail-open): ${String(err)}`)
  }
}
