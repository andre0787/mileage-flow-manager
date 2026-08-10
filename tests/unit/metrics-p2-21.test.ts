import { describe, it, expect } from "vitest";
import {
  categoryFromBranch,
  firstGreenPrLocal,
  proxyBypassPr,
  isSkipByDesign,
  splitByModel,
} from "../../scripts/metrics/lib.mjs";

type TestEvent = {
  timestamp?: string;
  type?: string;
  branch?: string;
  categoria?: string;
  errors?: number;
  description?: string;
  rule?: string;
  model?: string;
  resolvedModel?: string;
  data?: { branch?: string; result?: string };
  [key: string]: unknown;
};

const ev = (o: TestEvent): TestEvent => ({ timestamp: "2026-08-01T10:00:00Z", ...o });
const branchEvents = [
  ev({ type: "session:start", branch: "feat/x", categoria: "feature" }),
  ev({ type: "pre-pr", branch: "feat/x", errors: 2, description: "pre-pr FAIL" }),
  ev({ type: "rule:fail", branch: "feat/x", rule: "rule-10-clean" }),
  ev({ type: "pre-pr", branch: "feat/x", errors: 0, description: "pre-pr PASS" }),
];

describe("metrics lib", () => {
  it("categoria da branch por prefixo", () => {
    expect(categoryFromBranch("feat/x")).toBe("feature");
    expect(categoryFromBranch("docs/y")).toBe("docs");
    expect(categoryFromBranch("weird")).toBe("outro");
  });

  it("verde-na-1ª local: false quando houve rule:fail antes do 1º PASS", () => {
    const r = firstGreenPrLocal(branchEvents, "feat/x");
    expect(r.green).toBe(false);
    expect(typeof r.firstPassAt).toBe("string");
  });

  it("verde-na-1ª local: true quando PASS sem rule:fail anterior", () => {
    const clean = [
      ev({ type: "session:start", branch: "feat/x", categoria: "feature" }),
      ev({ type: "pre-pr", branch: "feat/x", errors: 0, description: "pre-pr PASS" }),
    ];
    expect(firstGreenPrLocal(clean, "feat/x").green).toBe(true);
  });

  it("proxy bypass: PR mergeado sem evento pre-pr na branch", () => {
    const pr = { number: 999, state: "MERGED", headRefName: "feat/nopre" };
    expect(proxyBypassPr(pr, [])).toBe(true);
    expect(
      proxyBypassPr(pr, [ev({ type: "pre-pr", branch: "feat/nopre", errors: 0 })]),
    ).toBe(false);
  });

  it("proxy bypass: caminho REST real (state closed + mergedAt) e PR não mergeado", () => {
    const restMerged = { number: 998, state: "closed", mergedAt: "2026-08-01T00:00:00Z", headRefName: "fix/nopre" };
    expect(proxyBypassPr(restMerged, [])).toBe(true);
    expect(
      proxyBypassPr(restMerged, [ev({ type: "pre-pr", branch: "fix/nopre", errors: 0 })]),
    ).toBe(false);
    // PR aberto/fechado sem merge não conta como bypass
    expect(proxyBypassPr({ number: 997, state: "closed", mergedAt: null, headRefName: "chore/x" }, [])).toBe(false);
    expect(proxyBypassPr({ number: 996, state: "open", headRefName: "feat/y" }, [])).toBe(false);
  });

  it("skip por design", () => {
    expect(isSkipByDesign("e2e-smoke")).toBe(true);
    expect(isSkipByDesign("check-pr")).toBe(false);
  });

  it("splitByModel agrupa por modelo", () => {
    const groups = splitByModel([
      ev({ type: "pre-pr", model: "model/a", errors: 0 }),
      ev({ type: "pre-pr", model: "model/b", errors: 0 }),
      ev({ type: "pre-pr", errors: 0 }),
    ]);
    expect(groups.map((g) => g.model).sort()).toEqual(["model/a", "model/b", "sem-modelo"]);
  });
});
