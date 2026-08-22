/**
 * P12.6-04 — Target Resolver
 *
 * Camada entre Mutation e Activation que resolve o alvo semanticamente.
 * Se o alvo não existir, a mutation falha explicitamente — nunca
 * tratar "target not found" como "mutation applied".
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { MutationActivation, MutationCase } from "./types";

// ─── Resolution Result ─────────────────────────────────────────

export interface TargetResolution {
  resolved: boolean;
  filePath: string;
  fileExists: boolean;
  contentBefore: string | null;
  matchFound: boolean;
  matchCount: number;
  error?: string;
}

// ─── Target Resolver ───────────────────────────────────────────

export function resolveTarget(mutation: MutationCase, projectRoot: string): TargetResolution {
  const activation = mutation.activation;

  switch (activation.type) {
    case "file_replace":
      return resolveFileReplace(activation, projectRoot);
    case "file_inject":
      return resolveFileInject(activation, projectRoot);
    case "file_delete_lines":
      return resolveFileDeleteLines(activation, projectRoot);
    case "env_override":
      return {
        resolved: true,
        filePath: `.env`,
        fileExists: true,
        contentBefore: null,
        matchFound: true,
        matchCount: 1,
      };
    case "mock_return":
      return {
        resolved: true,
        filePath: activation.module,
        fileExists: true,
        contentBefore: null,
        matchFound: true,
        matchCount: 1,
      };
    default:
      return {
        resolved: false,
        filePath: "unknown",
        fileExists: false,
        contentBefore: null,
        matchFound: false,
        matchCount: 0,
        error: `Unknown activation type: ${(activation as MutationActivation).type}`,
      };
  }
}

function resolveFileReplace(
  activation: Extract<MutationActivation, { type: "file_replace" }>,
  projectRoot: string,
): TargetResolution {
  const filePath = join(projectRoot, activation.file);
  const fileExists = existsSync(filePath);

  if (!fileExists) {
    return {
      resolved: false,
      filePath: activation.file,
      fileExists: false,
      contentBefore: null,
      matchFound: false,
      matchCount: 0,
      error: `File not found: ${activation.file}`,
    };
  }

  const content = readFileSync(filePath, "utf-8");
  const matchCount = countOccurrences(content, activation.search);

  return {
    resolved: matchCount > 0,
    filePath: activation.file,
    fileExists: true,
    contentBefore: content,
    matchFound: matchCount > 0,
    matchCount,
    error:
      matchCount === 0
        ? `Search string not found in ${activation.file}: "${activation.search}"`
        : undefined,
  };
}

function resolveFileInject(
  activation: Extract<MutationActivation, { type: "file_inject" }>,
  projectRoot: string,
): TargetResolution {
  const filePath = join(projectRoot, activation.file);
  const fileExists = existsSync(filePath);

  if (!fileExists) {
    return {
      resolved: false,
      filePath: activation.file,
      fileExists: false,
      contentBefore: null,
      matchFound: false,
      matchCount: 0,
      error: `File not found: ${activation.file}`,
    };
  }

  const content = readFileSync(filePath, "utf-8");
  const matchCount = countOccurrences(content, activation.after);

  return {
    resolved: matchCount > 0,
    filePath: activation.file,
    fileExists: true,
    contentBefore: content,
    matchFound: matchCount > 0,
    matchCount,
    error:
      matchCount === 0
        ? `Injection anchor not found in ${activation.file}: "${activation.after}"`
        : undefined,
  };
}

function resolveFileDeleteLines(
  activation: Extract<MutationActivation, { type: "file_delete_lines" }>,
  projectRoot: string,
): TargetResolution {
  const filePath = join(projectRoot, activation.file);
  const fileExists = existsSync(filePath);

  if (!fileExists) {
    return {
      resolved: false,
      filePath: activation.file,
      fileExists: false,
      contentBefore: null,
      matchFound: false,
      matchCount: 0,
      error: `File not found: ${activation.file}`,
    };
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const hasLines = activation.startLine <= lines.length && activation.endLine <= lines.length;

  return {
    resolved: hasLines,
    filePath: activation.file,
    fileExists: true,
    contentBefore: content,
    matchFound: hasLines,
    matchCount: hasLines ? activation.endLine - activation.startLine + 1 : 0,
    error: !hasLines
      ? `Line range ${activation.startLine}-${activation.endLine} exceeds file length (${lines.length})`
      : undefined,
  };
}

function countOccurrences(text: string, search: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(search, pos)) !== -1) {
    count++;
    pos += search.length;
  }
  return count;
}

// ─── Batch Resolution ──────────────────────────────────────────

export function resolveTargets(
  mutations: MutationCase[],
  projectRoot: string,
): Map<string, TargetResolution> {
  const results = new Map<string, TargetResolution>();
  for (const m of mutations) {
    results.set(m.id, resolveTarget(m, projectRoot));
  }
  return results;
}

export function getResolvableMutations(
  mutations: MutationCase[],
  projectRoot: string,
): MutationCase[] {
  return mutations.filter((m) => {
    const resolution = resolveTarget(m, projectRoot);
    return resolution.resolved;
  });
}
