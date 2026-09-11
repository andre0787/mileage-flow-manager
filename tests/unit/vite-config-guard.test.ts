import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
const ROOT = resolve(import.meta.dirname, "../..");
const VITE_CONFIG = readFileSync(resolve(ROOT, "vite.config.ts"), "utf8");

describe("vite.config (P1 react-router 8)", () => {
  it("não referencia react-router-dom (pacote removido — v8 unifica no core)", () => {
    expect(VITE_CONFIG).not.toContain("react-router-dom");
  });

  it("manualChunks captura react/react-router (vendor) e recharts (charts)", () => {
    expect(VITE_CONFIG).toContain('"node_modules/react"');
    expect(VITE_CONFIG).toContain('"node_modules/react-router"');
    expect(VITE_CONFIG).toContain('"node_modules/recharts"');
  });

  it("classifica corretamente as dependências no CHUNK_GROUPS em vite.config.ts", () => {
    const match = VITE_CONFIG.match(/const CHUNK_GROUPS[^=]*=\s*(\[\s*[\s\S]*?\n\];)/);
    expect(match).not.toBeNull();
    if (match) {
      const chunkGroups = eval(match[1].slice(0, -1)) as Array<{ name: string; modules: string[] }>;
      const manualChunks = (id: string) => {
        for (const { name, modules } of chunkGroups) {
          if (modules.some((mod) => id.includes(mod))) {
            return name;
          }
        }
        return undefined;
      };

      // Vendor
      expect(manualChunks("node_modules/react/index.js")).toBe("vendor");
      expect(manualChunks("node_modules/react-router/dist/index.js")).toBe("vendor");
      expect(manualChunks("node_modules/@reduxjs/toolkit/dist/index.js")).toBe("vendor");

      // UI
      expect(manualChunks("node_modules/@radix-ui/react-dialog/dist/index.js")).toBe("ui");
      expect(manualChunks("node_modules/lucide-react/dist/index.js")).toBe("ui");

      // Charts
      expect(manualChunks("node_modules/recharts/es6/index.js")).toBe("charts");

      // Fallback
      expect(manualChunks("src/main.tsx")).toBeUndefined();
    }
  });

  it("budget-check continua guardando o tamanho do index", () => {
    const budget = readFileSync(resolve(ROOT, "scripts/budget-check.mjs"), "utf8");
    expect(budget).toContain("Index:");
    expect(budget).toMatch(/exit\(1\)/);
  });
});