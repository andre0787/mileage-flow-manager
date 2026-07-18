import { describe, it, expect, afterAll } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");
const SCRIPT = resolve(ROOT, "scripts/session-start.mjs");

describe("session-start", () => {
  it("--set-category com categoria inválida → exit 1", () => {
    expect(() =>
      execSync(`node "${SCRIPT}" --set-category invalida objetivo`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 5000,
      })
    ).toThrow();
  });

  it("--set-category sem argumentos → exit 1", () => {
    expect(() =>
      execSync(`node "${SCRIPT}" --set-category`, {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 5000,
      })
    ).toThrow();
  });

  it("--set-category com categoria válida → exit 0", () => {
    const out = execSync(
      `node "${SCRIPT}" --set-category docs "teste unitário"`,
      {
        cwd: ROOT,
        encoding: "utf8",
        timeout: 5000,
      }
    );
    expect(out).toContain("✅ Sessão iniciada:");
  });
});

afterAll(() => {
  execSync("git checkout -- docs/handoff.md", {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 3000,
  });
});
