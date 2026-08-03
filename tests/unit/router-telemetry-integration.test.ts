import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = resolve(ROOT, "scripts/llm-route.mjs");

function runFromTracking(args: string[], trackingDir: string) {
  const env = { ...process.env, EVENT_LOG_TRACKING_DIR: trackingDir };
  for (const key of ["VITEST", "EVENT_LOG_DISABLED"]) delete env[key];
  return execFileSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env,
  }).trim();
}

function readEvents(trackingDir: string) {
  const logPath = join(trackingDir, "events.jsonl");
  if (!existsSync(logPath)) return [];
  return readFileSync(logPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe("router telemetry integration", () => {
  it("resolve e complete compartilham taskId e completam 1 rota", () => {
    const trackingDir = mkdtempSync(join(tmpdir(), "router-tracking-"));
    const decision = JSON.parse(
      runFromTracking(
        [
          "resolve",
          "--context",
          JSON.stringify({
            taskId: "integration-task-1",
            category: "feature",
            capability: "implementation",
            retrySafety: "may-write",
            source: "orchestrator-inference",
            skills: ["test-driven-development"],
          }),
        ],
        trackingDir,
      ),
    );
    runFromTracking(
      [
        "complete",
        "--event",
        JSON.stringify({
          taskId: "integration-task-1",
          model: decision.model,
          resolvedModel: decision.model,
          provider: decision.model.split("/")[0],
          attempt: 1,
          status: "completed",
          fallbackUsed: false,
          skills: ["test-driven-development"],
        }),
      ],
      trackingDir,
    );

    const rows = readEvents(trackingDir);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ type: "llm.route.resolved", taskId: "integration-task-1" });
    expect(rows[1]).toMatchObject({
      type: "llm.route.completed",
      taskId: "integration-task-1",
      status: "completed",
      fallbackUsed: false,
      skills: ["test-driven-development"],
    });
  });

  it("registra falha de pré-lançamento como conclusão failed", () => {
    const trackingDir = mkdtempSync(join(tmpdir(), "router-tracking-"));
    runFromTracking(
      [
        "complete",
        "--event",
        JSON.stringify({
          taskId: "integration-task-2",
          model: "openai-codex/gpt-5.4-mini",
          provider: "openai-codex",
          attempt: 1,
          status: "failed",
          failureKind: "subagent_prelaunch",
        }),
      ],
      trackingDir,
    );

    const rows = readEvents(trackingDir);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "failed", failureKind: "subagent_prelaunch" });
  });

  it("rejeita campo sensível via CLI sem escrever nada", () => {
    const trackingDir = mkdtempSync(join(tmpdir(), "router-tracking-"));
    let status = 0;
    try {
      runFromTracking(
        [
          "complete",
          "--event",
          JSON.stringify({
            taskId: "integration-task-3",
            model: "m",
            status: "completed",
            prompt: "SEGREDO-INTEGRATION",
          }),
        ],
        trackingDir,
      );
    } catch (error) {
      status = (error as { status?: number }).status ?? 1;
    }

    expect(status).toBe(1);
    expect(readEvents(trackingDir)).toEqual([]);
  });
});