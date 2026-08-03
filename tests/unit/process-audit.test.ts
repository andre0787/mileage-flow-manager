import { describe, expect, it } from "vitest";
import { execFileSync } from "child_process";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

const CLI = resolve(__dirname, "../../scripts/process-audit.mjs");

function runAudit(fixtureLines: string[], args: string[] = []): { status: number; stdout: string } {
  const dir = mkdtempSync(join(tmpdir(), "process-audit-"));
  const logPath = join(dir, "events.jsonl");
  writeFileSync(logPath, fixtureLines.join("\n") + "\n", "utf8");
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: "utf8",
      env: { ...process.env, PROCESS_EVENTS_PATH: logPath },
      timeout: 10000,
    });
    return { status: 0, stdout };
  } catch (error: unknown) {
    const e = error as { status?: number; stdout?: string };
    return { status: e.status ?? 1, stdout: e.stdout ?? "" };
  }
}

const VALID_EVENTS = [
  '{"type":"pre-pr","timestamp":"2026-08-01T10:00:00Z","branch":"feat/a","errors":0}',
  '{"type":"session:start","timestamp":"2026-08-01T09:00:00Z","branch":"feat/a","categoria":"feature"}',
];

describe("process-audit CLI", () => {
  it("--json retorna total, invalid, byType e unobserved", () => {
    const { status, stdout } = runAudit(VALID_EVENTS, ["--json"]);

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.total).toBe(2);
    expect(parsed.invalid).toBe(0);
    expect(parsed.byType).toMatchObject({ "pre-pr": 1, "session:start": 1 });
    expect(parsed.unobserved).toBe(0);
  });

  it("--check passa em fixture válida e falha em JSON malformado", () => {
    expect(runAudit(VALID_EVENTS, ["--check"]).status).toBe(0);
    expect(runAudit(["{broken"], ["--check"]).status).toBe(1);
  });

  it("resolução do router sem conclusão é unobserved, sem falhar o check", () => {
    const fixture = [
      '{"type":"llm.route.resolved","timestamp":"2026-08-01T10:00:00Z","taskId":"t1","category":"feature","capability":null,"profile":"coding","model":"model/primary","fallbackModels":[],"source":"category-default","retrySafety":"may-write","configVersion":1,"skills":[]}',
    ];

    const json = runAudit(fixture, ["--json"]);
    expect(json.status).toBe(0);
    expect(JSON.parse(json.stdout).unobserved).toBe(1);
    expect(runAudit(fixture, ["--check"]).status).toBe(0);
  });

  it("campo sensível falha o check sem ecoar o valor", () => {
    const fixture = [
      '{"type":"pre-pr","timestamp":"2026-08-01T10:00:00Z","branch":"feat/a","errors":0,"prompt":"SEGREDO-123"}',
    ];

    const { status, stdout } = runAudit(fixture, ["--check"]);
    expect(status).toBe(1);
    expect(stdout).not.toContain("SEGREDO-123");
    expect(stdout).toMatch(/sensitive|prompt/i);
  });

  it("relatório humano contém contagens e não valores sensíveis", () => {
    const fixture = [
      '{"type":"llm.route.resolved","timestamp":"2026-08-01T10:00:00Z","taskId":"t1","category":"feature","capability":null,"profile":"coding","model":"model/primary","fallbackModels":[],"source":"category-default","retrySafety":"may-write","configVersion":1,"skills":[]}',
      '{"type":"pre-pr","timestamp":"2026-08-01T11:00:00Z","branch":"feat/a","errors":0,"token":"abc"}',
    ];

    const { status, stdout } = runAudit(fixture, []);
    // Modo padrão é read-only informativo; exit 1 só com --check/--strict
    expect(status).toBe(0);
    expect(stdout).toContain("pre-pr");
    expect(stdout).not.toContain("abc");
  });
});
