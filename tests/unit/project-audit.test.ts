import { describe, expect, it } from "vitest";
import { classifyTrackedArtifacts } from "../../scripts/lib/project-audit.mjs";

describe("project-audit classification", () => {
  it("classifica relatório playwright versionado como generated critical", () => {
    expect(classifyTrackedArtifacts(["playwright-report/index.html"])).toEqual([
      expect.objectContaining({
        path: "playwright-report/index.html",
        category: "generated",
        severity: "critical",
      }),
    ]);
  });

  it("respeita allowlist de histórico e operação", () => {
    const result = classifyTrackedArtifacts([
      "docs/archive/old.md",
      "supabase/migrations/001.sql",
      "docs/tracking/events.jsonl",
      "docs/reports/2026-08-03/x.html",
      ".pi/skills/foo/SKILL.md",
      "scripts/lib/db.ts",
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "historical", path: "docs/archive/old.md" }),
        expect.objectContaining({ category: "historical", path: "docs/reports/2026-08-03/x.html" }),
        expect.objectContaining({ category: "allowlisted", path: "supabase/migrations/001.sql" }),
        expect.objectContaining({ category: "allowlisted", path: "docs/tracking/events.jsonl" }),
      ]),
    );
  });

  it("não reporta dist/test-results ignorados e paths de origem são normais", () => {
    const result = classifyTrackedArtifacts(["src/pages/KPI.tsx", "docs/handoff.md"]);

    const paths = result.map((f) => f.path);
    expect(paths).toContain("src/pages/KPI.tsx");
    expect(paths).toContain("docs/handoff.md");
  });

  it("ordena deterministicamente por severidade e caminho", () => {
    const result = classifyTrackedArtifacts([
      "zzz.md",
      "playwright-report/index.html",
      "aaa.md",
    ]);

    const severities = result.map((f) => f.severity);
    expect(severities[0]).toBe("critical");
    const pathsAfterCritical = result.filter((f) => f.severity !== "critical").map((f) => f.path);
    expect(pathsAfterCritical).toEqual([...pathsAfterCritical].sort());
  });
});