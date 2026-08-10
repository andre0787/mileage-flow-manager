import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve, join, dirname } from "path";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";

const ROOT = resolve(__dirname, "../..");
const SCRIPT = resolve(ROOT, "scripts/generate-graph.mjs");

// ─── Helpers ─────────────────────────────────────────────────────────

/** Cria um projeto src/ mínimo numa pasta temporária (MOCK_ROOT) */
function createFixture(files: Record<string, string>): string {
  const tmp = mkdtempSync(join(tmpdir(), "graph-test-"));
  for (const [rel, content] of Object.entries(files)) {
    const p = join(tmp, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  return tmp;
}

function cleanFixture(tmpPath: string) {
  try { rmSync(tmpPath, { recursive: true, force: true }); } catch { /* ignora */ }
}

/** Roda generate-graph.mjs com MOCK_ROOT; retorna { stdout, status } */
function runGraph(tmp: string, args = ""): { stdout: string; status: number } {
  const env = { ...process.env, MOCK_ROOT: tmp };
  try {
    const stdout = execSync(`node "${SCRIPT}" ${args} 2>&1`, {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 10000,
      env,
    });
    return { stdout, status: 0 };
  } catch (e: unknown) {
    const err = e as { stdout?: string; status?: number; message?: string };
    return { stdout: err.stdout || "", status: err.status ?? 1 };
  }
}

function readGraph(tmp: string) {
  return JSON.parse(readFileSync(join(tmp, ".pi/logs/dependency-graph.json"), "utf8"));
}

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    baseUrl: ".",
    paths: { "@/*": ["./src/*"] },
  },
});

// ─── Fixture básica (resolução @/ + relativo + bare) ───────────────

const FILES = {
  "tsconfig.json": TSCONFIG,
  "src/main.tsx": `import App from "@/App";\nimport { greet } from "./lib/utils";\nimport React from "react";\nimport { useQuery } from "@tanstack/react-query";\nvoid App; void greet; void React; void useQuery;\n`,
  "src/App.tsx": `import { Button } from "@/components/Button";\nexport default function App() { return Button; }\n`,
  "src/components/Button.tsx": `import { greet } from "@/lib/utils";\nexport const Button = greet;\n`,
  "src/lib/utils.ts": `export const greet = () => "oi";\n`,
};

// ─── Fixture de ciclo (a → b → a) ───────────────────────────────────

const CYCLE_FILES = {
  "tsconfig.json": TSCONFIG,
  "src/a.ts": `import { b } from "./b";\nexport const a = b;\n`,
  "src/b.ts": `import { a } from "./a";\nexport const b = a;\n`,
};

// ─── Fixture de imports de DIRETÓRIO com index (ex.: "@/types", "@/components/ui") ──
// Antes da correção, resolviam para o nó inexistente 'types'/'components/ui'
// (deps fantasmas); agora devem resolver para 'types/index'/'components/ui/index'.

const DIR_INDEX_FILES = {
  "tsconfig.json": TSCONFIG,
  "src/main.tsx": `import type { T } from "@/types";\nimport { Button } from "@/components/ui";\nexport default function App() { void T; return Button; }\n`,
  "src/types/index.ts": `export type T = string;\n`,
  "src/components/ui/index.ts": `export const Button = () => null;\n`,
};

// ─── Testes ─────────────────────────────────────────────────────────

describe("generate-graph.mjs", () => {
  it("resolve imports @/, relativos e ignora bare imports", () => {
    const tmp = createFixture(FILES);
    try {
      const res = runGraph(tmp);
      expect(res.status).toBe(0);
      const graph = readGraph(tmp);
      // chaves relativas a src/ sem extensão
      expect(graph["main"]).toEqual(["App", "lib/utils"]);
      expect(graph["App"]).toEqual(["components/Button"]);
      expect(graph["components/Button"]).toEqual(["lib/utils"]);
      expect(graph["lib/utils"]).toEqual([]);
      // bare imports NÃO entram no grafo
      const all = JSON.stringify(graph);
      expect(all).not.toContain("react");
      expect(all).not.toContain("@tanstack");
    } finally { cleanFixture(tmp); }
  });

  it("inicializa migration-status.json quando ausente", () => {
    const tmp = createFixture(FILES);
    try {
      runGraph(tmp);
      const status = JSON.parse(readFileSync(join(tmp, ".pi/logs/migration-status.json"), "utf8"));
      expect(status.fase).toBe("P0");
      expect(status.migrados).toBe(0);
      expect(typeof status.ultimaAtualizacao).toBe("string");
    } finally { cleanFixture(tmp); }
  });

  it("detecta ciclo e sai com exit 1 com --check", () => {
    const tmp = createFixture(CYCLE_FILES);
    try {
      const res = runGraph(tmp, "--check");
      expect(res.status).toBe(1);
      expect(res.stdout).toMatch(/ciclo|a.*b|b.*a/);
    } finally { cleanFixture(tmp); }
  });

  it("reporta ciclo sem --check sem falhar (exit 0)", () => {
    const tmp = createFixture(CYCLE_FILES);
    try {
      const res = runGraph(tmp);
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/ciclo/);
    } finally { cleanFixture(tmp); }
  });

  it("resolve import de diretório com index para o nó index (sem deps fantasmas)", () => {
    const tmp = createFixture(DIR_INDEX_FILES);
    try {
      const res = runGraph(tmp);
      expect(res.status).toBe(0);
      const graph = readGraph(tmp);
      // "@/types" → "types/index" (não "types"); "@/components/ui" → "components/ui/index"
      expect(graph["main"]).toEqual(["components/ui/index", "types/index"]);
      // nenhuma chave de destino pode ser diretório fantasma: todo dep tem nó real
      for (const [node, deps] of Object.entries(graph)) {
        for (const dep of deps) {
          expect(graph[dep], `dep ${dep} de ${node} deve existir`).toBeDefined();
        }
      }
      const all = JSON.stringify(graph);
      expect(all).not.toContain('"types"');
      expect(all).not.toContain('"components/ui"');
    } finally { cleanFixture(tmp); }
  });

  it("--dry-run não escreve arquivos", () => {
    const tmp = createFixture(FILES);
    try {
      const res = runGraph(tmp, "--dry-run");
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/dry-run/);
      expect(existsSync(join(tmp, ".pi/logs/dependency-graph.json"))).toBe(false);
      expect(existsSync(join(tmp, ".pi/logs/migration-status.json"))).toBe(false);
    } finally { cleanFixture(tmp); }
  });

  it("suporta DEBUG=true sem quebrar", () => {
    const tmp = createFixture(FILES);
    try {
      const env = { ...process.env, MOCK_ROOT: tmp, DEBUG: "true" };
      const stdout = execSync(`node "${SCRIPT}" --dry-run 2>&1`, {
        cwd: ROOT, encoding: "utf8", timeout: 10000, env,
      });
      expect(stdout).toMatch(/\[debug\]/);
    } finally { cleanFixture(tmp); }
  });
});
