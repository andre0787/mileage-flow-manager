// Telemetry Auditor — pi extension (Blueprint v9.0, rule-48).
//
// Registro compulsório de métricas de eficiência da IA ao finalizar task.
// Ativação: finalização de task. Diagnósticos em stderr (fail-open).
//
// Contrato:
//   - A lib src/lib/aiTelemetry.ts + tabela ai_telemetry (RLS) são a fonte
//     de verdade; o script `npm run telemetry:record` persiste o registro.
//   - A extensão apenas orienta o agente a executar o registro no fechamento
//     da task — nunca bloqueia e nunca escreve no banco por conta própria.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

function note(msg: string) {
  process.stderr.write(`[telemetry-auditor] ${msg}\n`)
}

export default async function (pi: ExtensionAPI) {
  try {
    const libPath = resolve(process.cwd(), "src/lib/aiTelemetry.ts")
    if (!existsSync(libPath)) {
      note("src/lib/aiTelemetry.ts ausente — telemetria indisponível (rule-48)")
      return
    }

    // Hook de tool_call: a cada comando relevante, lembra do registro final.
    pi.on("tool_call", async (event) => {
      try {
        const isBash = event.type === "bash" || event.input?.tool === "bash"
        if (!isBash) return
        const cmd = String(event.input?.command ?? "")
        if (/session:end|telemetry:record|telemetry-audit/.test(cmd)) {
          note("registro de telemetria detectado (session:end/telemetry:record) ✓")
        }
      } catch {
        /* fail open */
      }
    })
  } catch (err) {
    note(`desativada (fail-open): ${String(err)}`)
  }
}
