/**
 * ai-p11-score.test.ts — P11-10 Final Certification (npm run ai:p11:score).
 *
 * Valida o scorecard:
 * 1. Com o código implementado, o comando passa (exit 0, STATUS PASS).
 * 2. A lógica de scoring falha quando falta evidência (nenhum eixo compensa
 *    outro — spec §9/§10).
 */

import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");

function runScore(): { status: number; stdout: string } {
  const res = spawnSync("node", ["scripts/ai-p11-score.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60_000,
  });
  return { status: res.status ?? -1, stdout: res.stdout };
}

describe("ai:p11:score (P11-10)", () => {
  it("certifica PASS com o código implementado (todos os eixos ≥ 9,5)", () => {
    const { status, stdout } = runScore();
    expect(status).toBe(0);
    expect(stdout).toContain("STATUS");
    expect(stdout).toContain("PASS");
    expect(stdout).toContain("OVERALL");
  });

  it("lista os 15 eixos da spec §9", () => {
    const { stdout } = runScore();
    for (const axis of [
      "Graph abstraction",
      "Agent abstraction",
      "Model abstraction",
      "Context Packet",
      "Planner",
      "Scheduler",
      "Budgeting",
      "Domain Scout",
      "Telemetry",
      "Testing",
      "Neo4j readiness",
      "Real agent execution",
      "Agent agnosticism",
      "Adaptive orchestration",
      "E2E validation",
    ]) {
      expect(stdout).toContain(axis);
    }
  });

  it("falha quando não há evidência (nenhum eixo compensa outro)", () => {
    // Simula falta de evidência: roda com um caminho inexistente via env.
    const res = spawnSync("node", ["-e", `
      const src = require("fs").readFileSync("scripts/ai-p11-score.mjs", "utf8");
      // Ponto de injeção de teste: força evidência falsa.
      const patched = src.replace(
        "const AXES = [",
        "const __TEST_NO_EVIDENCE__ = true;\\nconst AXES = [",
      ).replace(
        "const evidenceOk = axis.evidence.filter(Boolean).length;",
        "const evidenceOk = __TEST_NO_EVIDENCE__ ? 0 : axis.evidence.filter(Boolean).length;",
      );
      require("fs").writeFileSync("/tmp/ai-p11-score-test.mjs", patched);
    `], { cwd: ROOT, encoding: "utf8" });
    expect(res.status).toBe(0);

    const failed = spawnSync("node", ["/tmp/ai-p11-score-test.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 60_000,
    });
    expect(failed.status).toBe(1);
    expect(failed.stdout).toContain("FAIL");
  });
});
