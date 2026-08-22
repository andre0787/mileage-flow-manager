import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { cleanupMutation, countOccurrences } from "../../scripts/p12.6-experiment.mjs";

describe("p12.6-experiment script hygiene", () => {
  it("countOccurrences conta matches literais sem regex", () => {
    expect(countOccurrences("a.b a.b a", "a.b")).toBe(2);
    expect(countOccurrences("sem match", "x")).toBe(0);
  });

  it("cleanupMutation restaura arquivo e remove backup .p126-backup", () => {
    const dir = mkdtempSync(join(tmpdir(), "p126-exp-"));
    try {
      const filePath = join(dir, "target.ts");
      const backupPath = `${filePath}.p126-backup`;
      writeFileSync(filePath, "mutated", "utf8");
      writeFileSync(backupPath, "original", "utf8");

      cleanupMutation({ id: "MXX" }, { filePath }, backupPath);

      expect(readFileSync(filePath, "utf8")).toBe("original");
      expect(existsSync(backupPath)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
