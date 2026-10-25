import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = join(dirPath, file);
    if (statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== "dist") {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

describe("Security check - no hardcoded Supabase keys", () => {
  test("ensures hardcoded publishable key is not present in tests or scripts", () => {
    const rootDir = resolve(__dirname, "../..");
    const testsDir = resolve(rootDir, "tests");
    const scriptsDir = resolve(rootDir, "scripts");
    const workflowsDir = resolve(rootDir, ".github/workflows");

    const currentFile = resolve(__filename);
    const filesToCheck = [
      ...getAllFiles(testsDir),
      ...getAllFiles(scriptsDir),
      ...getAllFiles(workflowsDir),
    ].filter((f) => f !== currentFile);

    const targetKeyPart = "sb_publishable_" + "TpuJ6Mokci012dnOdyMfyA_F0e3dZVs";

    const violations: string[] = [];
    filesToCheck.forEach((filePath) => {
      const content = readFileSync(filePath, "utf-8");
      if (content.includes(targetKeyPart)) {
        violations.push(filePath.replace(rootDir, ""));
      }
    });

    expect(violations).toEqual([]);
  });
});
