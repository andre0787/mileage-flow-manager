import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

// ─── Fixtures ────────────────────────────────────────────────────────────────

let tmp: string;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "harness-check-"));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

const CLI = resolve("scripts/harness-check.mjs");

function makeSettings(packages: string[]) {
  const dir = join(tmp, "pi-agent");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "settings.json"), JSON.stringify({ packages }, null, 2));
  return join(dir, "settings.json");
}

function makeAgents(names: string[]) {
  const dir = join(tmp, "agents");
  mkdirSync(dir, { recursive: true });
  for (const n of names) writeFileSync(join(dir, `${n}.md`), `---\nname: ${n}\n---\n`);
  return dir;
}

// ─── checkHarness (lib) ──────────────────────────────────────────────────────

describe("checkHarness (lib) — guard preventivo de subagentes (P2)", () => {
  it("detecta pacote pi-subagents ausente (installed=false)", async () => {
    const { checkHarness } = await import("../../scripts/lib/harness-check.mjs");
    const res = checkHarness({
      settingsPath: makeSettings(["npm:@firstpick/pi-package-webui"]),
      agentsDir: join(tmp, "agents-inexistente"),
    });
    expect(res.installed).toBe(false);
    expect(res.ok).toBe(false);
    // catálogo de fallback informa os agentes válidos mesmo sem o pacote
    expect(res.agents.length).toBeGreaterThanOrEqual(9);
    expect(res.agents).toContain("worker");
    expect(res.agents).toContain("reviewer");
  });

  it("detecta pacote instalado (installed=true) e lista agentes do catálogo", async () => {
    const { checkHarness } = await import("../../scripts/lib/harness-check.mjs");
    const res = checkHarness({
      settingsPath: makeSettings(["npm:pi-subagents", "npm:@firstpick/pi-package-webui"]),
      agentsDir: makeAgents(["worker", "reviewer", "oracle"]),
    });
    expect(res.installed).toBe(true);
    expect(res.ok).toBe(true);
    expect(res.agents).toEqual(expect.arrayContaining(["worker", "reviewer", "oracle"]));
  });

  it("agentes da fixture substituem o catálogo quando o diretório existe", async () => {
    const { checkHarness } = await import("../../scripts/lib/harness-check.mjs");
    const res = checkHarness({
      settingsPath: makeSettings(["npm:pi-subagents"]),
      agentsDir: makeAgents(["scout"]),
    });
    expect(res.agents).toEqual(["scout"]);
  });
});

// ─── CLI (mensagem acionável + exit code) ────────────────────────────────────

describe("harness-check CLI — falha rápido com mensagem acionável", () => {
  it("--check sem pacote → exit 1 + comando exato de instalação", async () => {
    const { execFileSync } = await import("child_process");
    const settingsPath = makeSettings(["npm:@firstpick/pi-package-webui"]);
    let status = 0;
    let out = "";
    try {
      out = execFileSync(
        process.execPath,
        [CLI, "--check"],
        {
          env: {
            ...process.env,
            PI_SETTINGS_PATH: settingsPath,
            PI_AGENTS_DIR: join(tmp, "agents-inexistente"),
          },
          encoding: "utf8",
        },
      );
    } catch (e: unknown) {
      const err = e as { status?: number; stdout?: unknown };
      status = err.status ?? 1;
      out = String(err.stdout ?? "");
    }
    expect(status).toBe(1);
    expect(out).toContain("pi install npm:pi-subagents");
    expect(out).toContain("worker");
  });

  it("--check com pacote → exit 0 e lista agentes disponíveis", async () => {
    const { execFileSync } = await import("child_process");
    const settingsPath = makeSettings(["npm:pi-subagents"]);
    const out = execFileSync(
      process.execPath,
      [CLI, "--check"],
      {
        env: {
          ...process.env,
          PI_SETTINGS_PATH: settingsPath,
          PI_AGENTS_DIR: makeAgents(["worker", "reviewer"]),
        },
        encoding: "utf8",
      },
    );
    expect(out).toContain("OK");
    expect(out).toContain("worker");
  });

  it("modo padrão é informativo e não falha (read-only)", async () => {
    const { execFileSync } = await import("child_process");
    const settingsPath = makeSettings(["npm:@firstpick/pi-package-webui"]);
    const out = execFileSync(process.execPath, [CLI], {
      env: { ...process.env, PI_SETTINGS_PATH: settingsPath },
      encoding: "utf8",
    });
    expect(out).toContain("pi-subagents");
  });

  it("atalho npm harness:check existe (rule-16)", () => {
    const pkg = readFileSync(resolve("package.json"), "utf8");
    expect(pkg).toMatch(/"harness:check"\s*:\s*"node scripts\/harness-check\.mjs"/);
  });
});
