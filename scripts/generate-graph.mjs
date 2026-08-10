#!/usr/bin/env node

/**
 * generate-graph.mjs — Gera o grafo de dependências interno de src/.
 *
 * Contrato (Blueprint v4.0 P0, spec 2026-08-10):
 * - Lê tsconfig.json → resolve alias `@/*` → `./src/*`.
 * - Varre src recursivamente por .ts/.tsx (ignora .d.ts e src/vite-env.d.ts).
 * - Extrai imports (`from "..."`, `import("...")`, `require("...")`) e resolve
 *   `@/x` e `./x`/`../x` relativos; bare imports (react, @tanstack/...) são ignorados.
 * - Escreve .pi/logs/dependency-graph.json: `{ "file": ["dep", ...] }` (ordenação estável).
 * - Inicializa .pi/logs/migration-status.json se ausente.
 * - Detecta ciclos via DFS (0=não visitado, 1=em visita, 2=concluído); imprime cadeias
 *   circulares no stdout; com `--check` e havendo ciclo, exit 1.
 * - Flags: `--dry-run` (não escreve, só imprime resumo), `DEBUG=true` (log detalhado).
 * - Modo fixture: `MOCK_ROOT` aponta para a raiz do projeto sob teste.
 *
 * ponytail: fs + path + child_process nativos, zero deps (sem ts-morph).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join, relative, dirname, sep } from "path";

const ROOT = process.env.MOCK_ROOT || resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const LOGS_DIR = join(ROOT, ".pi", "logs");
const GRAPH_PATH = join(LOGS_DIR, "dependency-graph.json");
const MIGRATION_STATUS_PATH = join(LOGS_DIR, "migration-status.json");

const DEBUG = process.env.DEBUG === "true";
const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");
const CHECK = ARGS.includes("--check");

// estados DFS: 0 = não visitado, 1 = em visita, 2 = concluído
const UNVISITED = 0;
const VISITING = 1;
const DONE = 2;

function debug(msg) {
  if (DEBUG) console.log(`  [debug] ${msg}`);
}

/** Varre src/ recursivamente por arquivos .ts/.tsx (ignora .d.ts e vite-env.d.ts) */
function scanSourceFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const st = statSync(p);
      if (st.isDirectory()) {
        walk(p);
      } else if (/\.(ts|tsx)$/.test(entry) && !/\.d\.ts$/.test(entry) && entry !== "vite-env.d.ts") {
        files.push(p);
      }
    }
  };
  walk(SRC);
  return files.sort();
}

/** Lê tsconfig.json e extrai o alias `@/*` → diretório-alvo (ex.: "src") */
function readAlias() {
  const tsconfigPath = join(ROOT, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    debug("tsconfig.json ausente — sem alias @/");
    return null;
  }
  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
    const paths = tsconfig.compilerOptions?.paths || {};
    for (const [key, targets] of Object.entries(paths)) {
      if (!key.endsWith("/*") || !Array.isArray(targets) || targets.length === 0) continue;
      const target = targets[0];
      if (!target.endsWith("/*")) continue;
      const prefix = key.slice(0, -1); // ex.: "@/"
      const dirRel = target.slice(0, -2).replace(/^\.\//, ""); // ex.: "src"
      debug(`alias ${prefix} → ${dirRel}`);
      return { prefix, dirRel };
    }
  } catch (e) {
    debug(`tsconfig.json inválido: ${e.message}`);
  }
  return null;
}

/**
 * Resolve um specifier de import para caminho relativo a src/ (posix, sem extensão).
 * Retorna null para bare imports e imports fora do grafo interno.
 */
function resolveSpecifier(spec, fileAbs, alias) {
  let abs;
  if (alias && spec.startsWith(alias.prefix)) {
    abs = join(ROOT, alias.dirRel, spec.slice(alias.prefix.length));
  } else if (spec.startsWith("./") || spec.startsWith("../")) {
    abs = resolve(dirname(fileAbs), spec);
  } else {
    return null; // bare import (react, @tanstack/..., node:...) — fora do grafo interno
  }

  const toRel = (p) => relative(SRC, p).split(sep).join("/");

  // Candidatos ordenados com ARQUIVO primeiro: um import de diretório
  // (ex.: "@/types") deve resolver para "types/index" e nunca para o
  // diretório em si — aceitar diretório criaria deps fantasmas para nós
  // inexistentes e quebraria a detecção de ciclos.
  const candidates = [];
  if (!/\.(ts|tsx|js|jsx)$/.test(abs)) {
    candidates.push(`${abs}.ts`, `${abs}.tsx`, join(abs, "index.ts"), join(abs, "index.tsx"));
  }
  candidates.push(abs); // só aceito se for arquivo (isFile), nunca diretório

  let rel = null;
  for (const c of candidates) {
    let st;
    try {
      st = statSync(c);
    } catch {
      continue; // não existe
    }
    if (st.isFile()) {
      rel = toRel(c);
      break;
    }
  }
  if (rel === null) rel = toRel(abs); // import quebrado (destino não é arquivo) — aresta p/ caminho bruto
  rel = rel.replace(/\.(ts|tsx)$/, "");
  if (!rel || rel === "") return null;
  return rel;
}

/** Extrai specifiers de imports: from "...", import("..."), require("...") */
function extractSpecifiers(source) {
  const specs = [];
  const re = /(?:from\s*|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source)) !== null) specs.push(m[1]);
  return specs;
}

/** DFS com cores (0/1/2); coleta cadeias circulares e retorna se há ciclo */
function findCycles(graph, nodes) {
  const color = new Map();
  const stack = [];
  const cycles = [];

  function dfs(node, path) {
    color.set(node, VISITING);
    stack.push(node);
    for (const dep of graph[node] || []) {
      const c = color.get(dep) ?? UNVISITED;
      if (c === UNVISITED) {
        if (!dfs(dep, path)) return false;
      } else if (c === VISITING) {
        const start = stack.indexOf(dep);
        const chain = [...stack.slice(start), dep];
        cycles.push(chain);
        if (CHECK) {
          printCycle(chain);
          return false; // interrompe a busca cedo quando --check
        }
      }
    }
    stack.pop();
    color.set(node, DONE);
    return true;
  }

  for (const node of nodes) {
    if ((color.get(node) ?? UNVISITED) === UNVISITED) {
      if (!dfs(node, stack)) break;
    }
  }
  return cycles;
}

function printCycle(chain) {
  console.log(`  ⚠️  ciclo: ${chain.join(" → ")}`);
}

function main() {
  debug(`ROOT=${ROOT}`);
  debug(`SRC=${SRC}`);

  if (!existsSync(SRC)) {
    console.log("  ⏭️  generate-graph: src/ não encontrado — nada a analisar");
    return;
  }

  const alias = readAlias();
  const files = scanSourceFiles();
  const graph = {};

  for (const fileAbs of files) {
    const key = relative(SRC, fileAbs).split(sep).join("/").replace(/\.(ts|tsx)$/, "");
    const source = readFileSync(fileAbs, "utf8");
    const deps = [];
    for (const spec of extractSpecifiers(source)) {
      const dep = resolveSpecifier(spec, fileAbs, alias);
      // auto-import (self-edge) é ignorado: quase sempre artefato de doc-comment/example,
      // e nunca é uma dependência interna significativa para o grafo
      if (dep && dep !== key) deps.push(dep);
    }
    graph[key] = [...new Set(deps)].sort();
    debug(`${key} → [${graph[key].join(", ")}]`);
  }

  const nodes = Object.keys(graph).sort();
  const totalDeps = nodes.reduce((acc, k) => acc + graph[k].length, 0);
  const cycles = findCycles(graph, nodes);

  if (cycles.length > 0 && !CHECK) {
    for (const chain of cycles) printCycle(chain);
  }

  console.log(
    `  ✅ generate-graph: ${nodes.length} arquivos, ${totalDeps} dependências internas, ${cycles.length} ciclo(s)` +
      (DRY_RUN ? " (dry-run — nada escrito)" : ""),
  );

  if (DRY_RUN) {
    if (CHECK && cycles.length > 0) process.exit(1);
    return;
  }

  mkdirSync(LOGS_DIR, { recursive: true });

  const sortedGraph = {};
  for (const key of nodes) sortedGraph[key] = graph[key];
  writeFileSync(GRAPH_PATH, JSON.stringify(sortedGraph, null, 2) + "\n");
  console.log(`  📄 dependency-graph.json → .pi/logs/dependency-graph.json`);

  if (!existsSync(MIGRATION_STATUS_PATH)) {
    const status = {
      fase: "P0",
      ultimaAtualizacao: new Date().toISOString(),
      migrados: 0,
    };
    writeFileSync(MIGRATION_STATUS_PATH, JSON.stringify(status, null, 2) + "\n");
    console.log(`  📄 migration-status.json inicializado (fase P0, migrados 0)`);
  } else {
    debug("migration-status.json já existe — mantido");
  }

  if (CHECK && cycles.length > 0) process.exit(1);
}

main();
