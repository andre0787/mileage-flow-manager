/**
 * scouts.ts — Graph / Domain / Test Scouts (Agent Execution Spec §15-17).
 *
 * Scouts são READ-ONLY: produzem análise estruturada a partir do
 * GraphQueryResult (ou fallback vazio) — nunca modificam código.
 * Fail-open: CRG ausente → available:false com resultado vazio.
 */

import { graphImpact, graphQuery } from "@/ai/graph/engine";
import type { GraphQueryResult } from "@/ai/core/graph-types";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

export interface GraphScoutResult {
  target: string;
  impactScore: number; // 0..1 (densidade de dependentes)
  directDependencies: string[];
  directDependents: string[];
  tests: string[];
  features: string[];
  risks: string[];
  recommendedFiles: string[];
  available: boolean;
}

export interface DomainScoutResult {
  entities: string[];
  relations: string[];
  tables: string[];
  businessRules: string[];
  dataImpacts: string[];
  available: boolean;
}

export interface TestScoutResult {
  existingTests: string[];
  gaps: string[];
  suites: string[];
  neededTests: string[];
  available: boolean;
}

export interface HistoryScoutResult {
  relatedTasks: string[];
  recentChanges: string[];
  lastScopes: string[];
  available: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  test: "tests",
  domain: "domainEntities",
  file: "files",
  symbol: "symbols",
};

function classify(result: GraphQueryResult): {
  tests: string[];
  domain: string[];
  files: string[];
  symbols: string[];
} {
  const out = { tests: [], domain: [], files: [], symbols: [] } as {
    tests: string[];
    domain: string[];
    files: string[];
    symbols: string[];
  };
  for (const n of result.nodes) {
    const bucket = TYPE_LABEL[n.type];
    if (bucket && bucket in out) (out as Record<string, string[]>)[bucket].push(n.label);
  }
  return out;
}

/** Graph Scout (§15): análise de impacto de um alvo. */
export function graphScout(target: string): GraphScoutResult {
  const result = graphImpact(target);
  const { tests, domain, files } = classify(result);
  const directDependents = result.reachable?.length
    ? result.reachable
    : [...new Set(result.edges.map((e) => e.source))];
  const directDependencies = [...new Set(result.edges.map((e) => e.target))];
  const impactScore = Math.min(1, directDependents.length / 10);

  return {
    target,
    impactScore,
    directDependencies,
    directDependents,
    tests,
    features: domain,
    risks: result.nodes.length === 0 ? ["grafo indisponível ou alvo sem cobertura"] : [],
    recommendedFiles: [...new Set([...files, ...tests])].slice(0, 10),
    available: result.nodes.length > 0 || result.edges.length > 0,
  };
}

/**
 * Domain Scout (§16): entidades e relações de domínio + tabelas reais
 * (parse fail-open das migrations `CREATE TABLE public.xxx`).
 * Regras de negócio não são inferíveis do schema — ficam como nota.
 */
export function domainScout(target?: string): DomainScoutResult {
  const result = target ? graphImpact(target) : graphQuery();
  const { domain } = classify(result);
  const relations = [
    ...new Set(
      result.edges.filter((e) => e.type === "references").map((e) => `${e.source}→${e.target}`),
    ),
  ];
  const tables = listDomainTables();
  return {
    entities: domain,
    relations,
    tables,
    businessRules: [],
    dataImpacts: [],
    available: domain.length > 0 || relations.length > 0 || tables.length > 0,
  };
}

/** Tabelas de domínio via parse de `CREATE TABLE public.xxx` nas migrations (fail-open). */
export function listDomainTables(migrationsDir?: string): string[] {
  const dir = migrationsDir ?? resolve(process.cwd(), "supabase/migrations");
  if (!existsSync(dir)) return [];
  const tables = new Set<string>();
  try {
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
      const content = readFileSync(join(dir, f), "utf8");
      for (const m of content.matchAll(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_]+)/gi,
      )) {
        tables.add(m[1]);
      }
    }
  } catch {
    /* fail-open */
  }
  return [...tables].sort();
}

/** Test Scout (§17): testes existentes e gaps. */
export function testScout(target?: string): TestScoutResult {
  const result = target ? graphImpact(target) : graphQuery();
  const { tests } = classify(result);
  const files = result.nodes.filter((n) => n.type === "file").map((n) => n.label);
  const gapCount = files.length - tests.length;
  return {
    existingTests: tests,
    gaps: gapCount > 0 ? [`${gapCount} arquivo(s) sem teste direto no grafo`] : [],
    suites: [...new Set(tests.map((t) => t.split("/").slice(0, -1).join("/") || "(root)"))],
    neededTests:
      gapCount > 0
        ? files.slice(0, gapCount).map((f) => `${f} → ${f.replace(/\.(ts|tsx)$/, ".test.$1")}`)
        : [],
    available: tests.length > 0 || files.length > 0,
  };
}

/**
 * History Scout (§7): contexto histórico da task — tasks relacionadas no
 * event log + commits recentes que tocaram o alvo. Fail-open: sem event log
 * ou sem git → available:false com arrays vazios (nunca lança).
 */
export function historyScout(target?: string): HistoryScoutResult {
  const relatedTasks: string[] = [];
  const recentChanges: string[] = [];
  try {
    const eventsPath = resolve(process.cwd(), "docs/tracking/events.jsonl");
    if (existsSync(eventsPath)) {
      const lines = readFileSync(eventsPath, "utf8").split("\n").filter(Boolean).slice(-400);
      for (const line of lines) {
        try {
          const e = JSON.parse(line) as {
            type?: string;
            description?: string;
            branch?: string;
          };
          if (
            (e.type === "session:start" || e.type === "commit") &&
            e.description &&
            (!target ||
              e.description.toLowerCase().includes(target.toLowerCase()) ||
              e.branch?.toLowerCase().includes(target.toLowerCase()))
          ) {
            relatedTasks.push(e.description);
          }
        } catch {
          /* linha inválida */
        }
      }
    }
  } catch {
    /* fail-open */
  }
  try {
    const git = spawnSync("git", ["log", "--oneline", "-10", ...(target ? [`--`, target] : [])], {
      encoding: "utf8",
      timeout: 10_000,
    });
    if (!git.error && git.status === 0 && git.stdout) {
      recentChanges.push(...git.stdout.trim().split("\n").filter(Boolean));
    }
  } catch {
    /* fail-open */
  }
  const lastScopes = [...new Set(relatedTasks.map((t) => t.split(":")[0]?.trim()).filter(Boolean))];
  return {
    relatedTasks: [...new Set(relatedTasks)].slice(0, 10),
    recentChanges: recentChanges.slice(0, 10),
    lastScopes: lastScopes.slice(0, 5),
    available: relatedTasks.length > 0 || recentChanges.length > 0,
  };
}
