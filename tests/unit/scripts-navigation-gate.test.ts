import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");
const SCRIPT = resolve(ROOT, "scripts/navigation-gate.mjs");

function runGate(extraArgs = [], extraEnv = {}) {
  return execSync(`node "${SCRIPT}" ${extraArgs.join(" ")}`, {
    cwd: ROOT,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
    timeout: 10000,
  });
}

describe("navigation-gate.mjs", () => {
  it("--force crg → stdout contém crg e exit 0", () => {
    const out = runGate(["--force", "crg"], { CRG_BIN: "/bin/true" });
    expect(out).toContain("crg");
  });

  it("--force serena → stdout contém serena", () => {
    const out = runGate(["--force", "serena"], { CRG_BIN: "/bin/false" });
    expect(out).toContain("serena");
  });

  it("--force grep → stdout contém grep", () => {
    const out = runGate(["--force", "grep"], { CRG_BIN: "/bin/true", SERENA_MCP_URL: "http://localhost:1" });
    expect(out).toContain("grep");
  });

  it("detecção default: CRG falha e SERENA_MCP_URL vazio → tool grep", () => {
    const out = runGate([], { CRG_BIN: "/bin/false", SERENA_MCP_URL: "" });
    expect(out).toContain("grep");
  });

  it("detecção default: CRG ok → tool crg", () => {
    const out = runGate([], { CRG_BIN: "/bin/true", SERENA_MCP_URL: "" });
    expect(out).toContain("crg");
  });

  it("detecção default: CRG falha mas SERENA_MCP_URL definido → tool serena", () => {
    const out = runGate([], { CRG_BIN: "/bin/false", SERENA_MCP_URL: "http://serena:1" });
    expect(out).toContain("serena");
  });

  it("--json com CRG ok → JSON parseável com tool crg", () => {
    const out = runGate(["--json"], { CRG_BIN: "/bin/true", SERENA_MCP_URL: "" });
    const parsed = JSON.parse(out);
    expect(parsed.tool).toBe("crg");
    expect(parsed.available.crg).toBe(true);
    expect(parsed.available.serena).toBe(false);
  });

  it("--force inválido → stderr com erro e exit 1", () => {
    try {
      runGate(["--force", "invalido"], { CRG_BIN: "/bin/true" });
      expect(true).toBe(false);
    } catch (e) {
      const err = e as { status?: number; stderr?: string };
      expect(err.status).toBe(1);
      expect(err.stderr || "").toContain("--force inválido");
    }
  });
});
