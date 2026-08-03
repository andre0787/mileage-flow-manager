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

  it("budget-check continua guardando o tamanho do index", () => {
    const budget = readFileSync(resolve(ROOT, "scripts/budget-check.mjs"), "utf8");
    expect(budget).toContain("Index:");
    expect(budget).toMatch(/exit\(1\)/);
  });
});