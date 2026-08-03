import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { GENERATED_ARTIFACTS, stageGeneratedArtifacts } from "../../scripts/lib/generated-artifacts.mjs";

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "gen-artifacts-"));
  const env = { ...process.env };
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_PREFIX"]) {
    delete env[key];
  }
  execSync("git init -q", { cwd: dir, env });
  execSync('git config user.email "t@t.com" && git config user.name "T"', { cwd: dir, env });
  writeFileSync(join(dir, "README.md"), "# r\n");
  execSync("git add -A && git commit -qm init", { cwd: dir, env });
  return { dir, env };
}

describe("generated-artifacts allowlist", () => {
  it("contém os artefatos gerados conhecidos", () => {
    expect([...GENERATED_ARTIFACTS].sort()).toEqual([
      "docs/RADAR.md",
      "docs/tracking/events-archive.jsonl",
      "docs/tracking/events.jsonl",
      "docs/tracking/quality-archive.jsonl",
      "docs/tracking/quality.jsonl",
      "public/kpi-data.json",
    ]);
  });

  it("stageia apenas artefatos presentes e nunca src/docs arbitrários", () => {
    const { dir, env } = makeRepo();
    mkdirSync(join(dir, "public"), { recursive: true });
    mkdirSync(join(dir, "docs/tracking"), { recursive: true });
    mkdirSync(join(dir, "src/components"), { recursive: true });
    writeFileSync(join(dir, "public/kpi-data.json"), "{}");
    writeFileSync(join(dir, "docs/tracking/events.jsonl"), "{}");
    writeFileSync(join(dir, "src/components/New.tsx"), "export const x = 1;");
    writeFileSync(join(dir, "docs/notes.md"), "# notas");

    const staged = stageGeneratedArtifacts(dir);

    expect(staged.sort()).toEqual([
      "docs/tracking/events.jsonl",
      "public/kpi-data.json",
    ]);
    const status = execSync("git status --short", { cwd: dir, env, encoding: "utf8" });
    expect(status).toContain("A  docs/tracking/events.jsonl");
    expect(status).toContain("A  public/kpi-data.json");
    expect(status).not.toMatch(/^[AM]\s+src\//m);
    expect(status).not.toMatch(/^[AM]\s+docs\/notes\.md/m);
  });
});
