/**
 * generated-artifacts.mjs — Staging explícito dos artefatos gerados pelo workflow.
 *
 * O pre-pr gera e atualiza quatro artefatos conhecidos (RADAR, eventos, quality,
 * KPI). Eles podem ser stageados automaticamente; código, docs intencionais e
 * config nunca passam por staging automático.
 *
 * ponytail: fs + child_process nativos, zero deps.
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { execFileSync } from "child_process";

export const GENERATED_ARTIFACTS = Object.freeze([
  "docs/RADAR.md",
  "docs/handoff.md",
  "docs/MAP.md",
  "docs/tracking/events.jsonl",
  "docs/tracking/quality.jsonl",
  "docs/tracking/events-archive.jsonl",
  "docs/tracking/quality-archive.jsonl",
  "public/kpi-data.json",
]);

/**
 * Stageia apenas os artefatos gerados que existem no repositório.
 * @param {string} root
 * @returns {string[]} artefatos stageados
 */
export function stageGeneratedArtifacts(root) {
  const staged = [];
  // Remove contexto Git herdado de hooks (GIT_INDEX_FILE/GIT_DIR) para que o
  // staging atue no repositório real e não no índice temporário do commit.
  const env = { ...process.env };
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_COMMON_DIR", "GIT_PREFIX"]) {
    delete env[key];
  }
  for (const rel of GENERATED_ARTIFACTS) {
    const abs = resolve(root, rel);
    if (!existsSync(abs)) continue;
    execFileSync("git", ["add", "--", rel], { cwd: root, env, encoding: "utf8", timeout: 5000 });
    staged.push(rel);
  }
  return staged;
}
