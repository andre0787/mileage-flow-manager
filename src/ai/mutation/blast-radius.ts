/**
 * P12.6-10 — Blast Radius Analysis
 *
 * Registra o impacto de cada fix:
 *   changed files, changed lines, modules touched,
 *   tests added, dependencies changed, config changed.
 *
 * Compara expected vs actual scope.
 * Grande divergência → review required.
 */

import type { BlastRadius } from "./types";

// ─── Blast Radius Calculator ───────────────────────────────────

export interface BlastRadiusInput {
  changedFiles: string[];
  addedLines?: number;
  removedLines?: number;
  testsAdded?: string[];
  dependenciesAdded?: string[];
  dependenciesRemoved?: string[];
  configChanged?: boolean;
  expectedFiles?: string[];
}

const SHORTCIRCUIT_MODULES = ["features", "pages", "components", "lib", "hooks"];

function extractModule(filePath: string): string {
  const parts = filePath.split("/");
  const featureIdx = parts.findIndex((p) => SHORTCIRCUIT_MODULES.includes(p));
  if (featureIdx >= 0 && featureIdx + 1 < parts.length) {
    return parts[featureIdx + 1];
  }
  return parts.slice(0, 2).join("/");
}

export function computeBlastRadius(input: BlastRadiusInput): BlastRadius {
  const modulesTouched = [...new Set(input.changedFiles.map(extractModule))];
  const changedLines = (input.addedLines || 0) + (input.removedLines || 0);

  // Compute divergence
  let divergenceLevel: BlastRadius["divergenceLevel"] = "minimal";
  if (input.expectedFiles && input.expectedFiles.length > 0) {
    const expectedSet = new Set(input.expectedFiles);
    const actualSet = new Set(input.changedFiles);
    const extraFiles = input.changedFiles.filter((f) => !expectedSet.has(f));
    const ratio = extraFiles.length / Math.max(input.changedFiles.length, 1);

    if (ratio > 0.75) divergenceLevel = "excessive";
    else if (ratio > 0.5) divergenceLevel = "large";
    else if (ratio > 0.25) divergenceLevel = "moderate";
  } else {
    // Heuristic: if > 10 files changed, it's large
    if (input.changedFiles.length > 10) divergenceLevel = "large";
    else if (input.changedFiles.length > 5) divergenceLevel = "moderate";
  }

  return {
    changedFiles: input.changedFiles,
    changedLines,
    modulesTouched,
    testsAdded: input.testsAdded?.length || 0,
    dependenciesChanged: [
      ...(input.dependenciesAdded || []),
      ...(input.dependenciesRemoved || []),
    ],
    configChanged: input.configChanged || false,
    divergenceLevel,
  };
}

// ─── Blast Radius Scoring ──────────────────────────────────────

export interface BlastRadiusScore {
  score: number; // 0-1, higher is better (smaller blast radius = better)
  rating: "excellent" | "good" | "moderate" | "concerning" | "dangerous";
  reviewRequired: boolean;
}

export function scoreBlastRadius(radius: BlastRadius): BlastRadiusScore {
  let score = 1.0;

  // Penalize for files
  if (radius.changedFiles.length > 10) score -= 0.3;
  else if (radius.changedFiles.length > 5) score -= 0.15;
  else if (radius.changedFiles.length > 3) score -= 0.05;

  // Penalize for lines
  if (radius.changedLines > 200) score -= 0.3;
  else if (radius.changedLines > 100) score -= 0.15;
  else if (radius.changedLines > 50) score -= 0.05;

  // Penalize for modules
  if (radius.modulesTouched.length > 3) score -= 0.2;
  else if (radius.modulesTouched.length > 2) score -= 0.1;

  // Penalize for config changes
  if (radius.configChanged) score -= 0.1;

  // Penalize for dependency changes
  if (radius.dependenciesChanged.length > 0) score -= 0.15;

  // Bonus for adding tests
  if (radius.testsAdded > 0) score += 0.1;

  // Divergence penalty
  if (radius.divergenceLevel === "excessive") score -= 0.4;
  else if (radius.divergenceLevel === "large") score -= 0.25;
  else if (radius.divergenceLevel === "moderate") score -= 0.1;

  score = Math.max(0, Math.min(1, score));

  let rating: BlastRadiusScore["rating"];
  if (score >= 0.85) rating = "excellent";
  else if (score >= 0.7) rating = "good";
  else if (score >= 0.5) rating = "moderate";
  else if (score >= 0.3) rating = "concerning";
  else rating = "dangerous";

  return {
    score,
    rating,
    reviewRequired: radius.divergenceLevel === "excessive" || radius.divergenceLevel === "large",
  };
}
