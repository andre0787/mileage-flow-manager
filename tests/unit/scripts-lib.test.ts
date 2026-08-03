import { describe, expect, it } from "vitest";
import { chooseMergeBase } from "../../scripts/lib.mjs";

describe("scripts/lib.mjs getDiffFiles", () => {
  it("prefere origin/main ao main local desatualizado", () => {
    const mergeBases = new Map([
      ["origin/main", "origin-commit"],
      ["main", "local-commit"],
    ]);

    expect(chooseMergeBase("main", (ref) => mergeBases.get(ref) ?? "")).toBe("origin-commit");
  });

  it("usa main local quando origin/main não está disponível", () => {
    expect(
      chooseMergeBase("main", (ref) => (ref === "main" ? "local-commit" : "")),
    ).toBe("local-commit");
  });
});
