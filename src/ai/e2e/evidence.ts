/**
 * evidence.ts — E2E Evidence System (P12.5-07).
 *
 * Toda execução E2E produz um Evidence Pack com metadata + artifacts.
 * Metadata → storage estruturado; artifacts → object storage com retention.
 * Redaction obrigatória: nunca secrets/dados sensíveis (T19).
 */

import type { Artifact, ConsoleLog, NetworkEvent } from "./browser-adapter";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface EvidencePack {
  findingId: string;
  runId: string;
  scenarioId: string;
  timestamp: string;
  commitSha: string;
  environment: string;
  browser: string;
  url: string;
  preconditions: string[];
  steps: string[];
  expected: string;
  actual: string;
  severity: FindingSeverity;
  screenshots: Artifact[];
  traces: Artifact[];
  domSnapshots: Artifact[];
  consoleLogs: ConsoleLog[];
  networkEvents: NetworkEvent[];
  telemetryRefs: string[];
  /** Redação aplicada? (T19) */
  redacted: boolean;
}

/** Secrets patterns — redação (T19). */
const SECRET_PATTERNS: RegExp[] = [
  /(password|passwd|pwd|token|api[_-]?key|secret|session[_-]?id)\s*[:=]\s*[^\s,;]+/gi,
  /sb_publishable_[A-Za-z0-9_]+/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
];

export function redact(text: string): string {
  let out = text;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, (m) =>
      re.source.includes("sb_publishable") || re.source.includes("eyJ")
        ? "[REDACTED]"
        : m.split("=")[0] + "=[REDACTED]",
    );
  }
  return out;
}

export interface EvidencePackInput {
  findingId: string;
  runId: string;
  scenarioId: string;
  commitSha: string;
  environment: string;
  browser: string;
  url: string;
  preconditions: string[];
  steps: string[];
  expected: string;
  actual: string;
  severity: FindingSeverity;
  screenshots?: Artifact[];
  traces?: Artifact[];
  domSnapshots?: Artifact[];
  consoleLogs?: ConsoleLog[];
  networkEvents?: NetworkEvent[];
  telemetryRefs?: string[];
}

export function createEvidencePack(input: EvidencePackInput): EvidencePack {
  return {
    ...input,
    screenshots: input.screenshots ?? [],
    traces: input.traces ?? [],
    domSnapshots: input.domSnapshots ?? [],
    consoleLogs: (input.consoleLogs ?? []).map((c) => ({ ...c, text: redact(c.text) })),
    networkEvents: (input.networkEvents ?? []).map((n) => ({ ...n, responseBodyRedacted: true })),
    telemetryRefs: input.telemetryRefs ?? [],
    redacted: true,
    timestamp: new Date().toISOString(),
  };
}

/** Retention: artefatos de evidência expiram após N dias (P12.5-07). */
export function isEvidenceExpired(pack: EvidencePack, retentionDays: number, now: number): boolean {
  const age = now - new Date(pack.timestamp).getTime();
  return age > retentionDays * 24 * 60 * 60 * 1000;
}

/** Completeness da evidência (E2E telemetry completeness ≥ 99,5%). */
export function evidenceCompleteness(pack: EvidencePack): number {
  const checks = [
    pack.findingId.length > 0,
    pack.runId.length > 0,
    pack.scenarioId.length > 0,
    pack.commitSha.length > 0,
    pack.environment.length > 0,
    pack.browser.length > 0,
    pack.url.length > 0,
    pack.expected.length > 0,
    pack.actual.length > 0,
    pack.redacted,
    pack.screenshots.length > 0,
    pack.consoleLogs.length > 0,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 1000) / 10;
}

/** Meta P12.5: telemetry/evidence completeness ≥ 99,5%. */
export function evidenceCompletenessMet(pack: EvidencePack): boolean {
  return evidenceCompleteness(pack) >= 99.5;
}

/** Nenhum secret persistido? (T19) — true se há padrão de secret visível (não redigido). */
export function hasSecretLeak(pack: EvidencePack): boolean {
  const probe = [
    ...pack.consoleLogs.map((c) => c.text),
    pack.url,
    ...pack.steps,
    ...pack.preconditions,
    pack.actual,
    pack.expected,
  ].join("\n");
  // Após redact(), qualquer secret remanescente indica leak
  return /sb_publishable_[A-Za-z0-9_]{16,}|eyJ[A-Za-z0-9_.-]{30,}|(?:password|token|api[_-]?key|secret)\s*=\s*[^\s[(][^\s]{4,}/i.test(
    probe,
  );
}
