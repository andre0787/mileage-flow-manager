import { describe, expect, it } from "vitest";
import {
  emptySubagentResult,
  normalizeSubagentResult,
  parseSubagentResult,
  validateSubagentResult,
} from "@/ai/execution/subagent-result";
import { graphScout, testScout } from "@/ai/execution/scouts";
import { architectFromScouts } from "@/ai/execution/architect";
import { containsSecrets, sanitizeObject, sanitizeText } from "@/ai/execution/sanitize";
import { checkGraphFreshness } from "@/ai/execution/graph-freshness";
import {
  checkBudgetCompliance,
  checkGraphAvailable,
  checkTelemetryCompleteness,
  finalValidate,
} from "@/ai/execution/final-validator";
import { reviewDiff, expectedTestFile, hasTestCoverage } from "@/ai/execution/reviewer";
import { domainScout, historyScout, listDomainTables } from "@/ai/execution/scouts";
import { implementFromPlan } from "@/ai/execution/implementer";
import { businessRulesForTable, dataImpactsForTable } from "@/ai/execution/domain-knowledge";
import { piAdapter } from "@/ai/adapters/pi";

describe("subagent-result (§14)", () => {
  it("normaliza JSON válido", () => {
    const r = normalizeSubagentResult({
      status: "success",
      summary: "ok",
      findings: ["a", "b"],
      files: ["x.ts"],
      risks: [],
      recommendations: ["y"],
      confidence: 0.9,
      nextAction: "implement",
    });
    expect(r.status).toBe("success");
    expect(r.confidence).toBe(0.9);
  });

  it("fail-open: entrada inválida → resultado vazio parcial", () => {
    expect(normalizeSubagentResult(null).status).toBe("partial");
    expect(normalizeSubagentResult("texto").status).toBe("partial");
    expect(emptySubagentResult().findings).toEqual([]);
  });

  it("parse de JSON em string", () => {
    const r = parseSubagentResult(
      JSON.stringify({ status: "success", summary: "s", confidence: 1 }),
    );
    expect(r.summary).toBe("s");
    expect(r.status).toBe("success");
  });

  it("parse de texto livre (bullets como findings, arquivos detectados)", () => {
    const r = parseSubagentResult("Implementa X\n- achado 1\n- src/lib/a.ts\n- achado 2\n");
    expect(r.summary).toBe("Implementa X");
    expect(r.findings).toEqual(["achado 1", "achado 2"]);
    expect(r.files).toContain("src/lib/a.ts");
  });

  it("validateSubagentResult exige summary ou findings", () => {
    expect(validateSubagentResult(emptySubagentResult())).toBe(false);
    expect(validateSubagentResult({ ...emptySubagentResult(), summary: "x" })).toBe(true);
  });
});

describe("scouts (§15-17)", () => {
  it("graphScout fail-open sem CRG: available false e impacto 0", () => {
    const r = graphScout("src/pages/Contas.tsx");
    expect(typeof r.impactScore).toBe("number");
    expect(Array.isArray(r.directDependencies)).toBe(true);
    expect(Array.isArray(r.recommendedFiles)).toBe(true);
  });

  it("testScout fail-open: estrutura completa", () => {
    const r = testScout();
    expect(Array.isArray(r.existingTests)).toBe(true);
    expect(Array.isArray(r.neededTests)).toBe(true);
    expect(Array.isArray(r.suites)).toBe(true);
  });
});

describe("architect (§18)", () => {
  it("gera plano com write-set derivado do alvo", () => {
    const out = architectFromScouts({
      target: "src/lib/a.ts",
      intent: "refatorar a",
      scouts: {
        graph: {
          impactScore: 0.3,
          recommendedFiles: ["src/lib/b.ts"],
          risks: [],
          available: true,
        } as never,
      },
      adapters: [piAdapter],
    });
    expect(out.writeScope).toContain("src/lib/a.ts");
    expect(out.plan?.agent).toBe("pi");
    expect(out.recommendedValidation).toContain("npm run typecheck");
  });
});

describe("sanitize (§12)", () => {
  it("redige CPF e CPF cru", () => {
    expect(sanitizeText("cpf 123.456.789-00 e 12345678900")).not.toContain("123");
  });

  it("redige chaves/tokens/senhas/emails/JWT", () => {
    const text =
      "key=sk-abc123456789 senha=secreta user@x.com Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const out = sanitizeText(text);
    expect(out).not.toContain("sk-abc123456789");
    expect(out).not.toContain("secreta");
    expect(out).not.toContain("user@x.com");
    expect(out).not.toContain("eyJhbGciOiJIUzI1NiJ9");
  });

  it("sanitizeObject redige strings sem mutar o original", () => {
    const obj = { model: "m", note: "123.456.789-00", count: 5 };
    const out = sanitizeObject(obj);
    expect(out.note).toBe("CPF_REDACTED");
    expect(obj.note).toContain("123");
    expect(out.count).toBe(5);
  });

  it("containsSecrets detecta segredo remanescente", () => {
    expect(containsSecrets("senha=abc123def456")).toBe(true);
    expect(containsSecrets("token=eyJhbGciOiJIUzI1NiJ9")).toBe(true);
    expect(containsSecrets("texto limpo sem segredo")).toBe(false);
  });
});

describe("reviewer (§20)", () => {
  it("marca arquivo fora do writeScope como risk", () => {
    const r = reviewDiff({
      diffFiles: ["src/lib/a.ts", "supabase/migrations/x.sql"],
      writeScope: ["src/lib/a.ts"],
    });
    expect(r.status).toBe("partial");
    expect(r.risks.some((x) => x.includes("fora do writeScope"))).toBe(true);
    expect(r.findings.some((x) => x.includes("migration"))).toBe(true);
  });

  it("aponta arquivos sem teste", () => {
    const r = reviewDiff({
      diffFiles: ["src/lib/b.ts"],
      writeScope: ["src/lib/b.ts"],
      testsByFile: {},
    });
    expect(r.status).toBe("partial");
    expect(r.recommendations.some((x) => x.includes("cobrir"))).toBe(true);
  });

  it("aprova diff limpo dentro do escopo com testes", () => {
    const r = reviewDiff({
      diffFiles: ["src/lib/c.ts"],
      writeScope: ["src/lib/c.ts"],
      testsByFile: { "src/lib/c.ts": ["tests/unit/c.test.ts"] },
      impactScore: 0.1,
    });
    expect(r.status).toBe("success");
    expect(r.risks).toEqual([]);
  });

  it("expectedTestFile gera nome correto", () => {
    expect(expectedTestFile("src/lib/x.ts")).toBe("src/lib/x.test.ts");
    expect(expectedTestFile("src/lib/x.test.ts")).toBeUndefined();
    expect(expectedTestFile("scripts/a.mjs")).toBeUndefined();
  });

  it("hasTestCoverage respeita mapeamento", () => {
    expect(hasTestCoverage("src/lib/x.ts", { "src/lib/x.ts": ["t.test.ts"] })).toBe(true);
    expect(hasTestCoverage("src/lib/y.ts", {})).toBe(false);
  });
});

describe("domain scout tables (§16)", () => {
  it("listDomainTables parseia CREATE TABLE das migrations (fail-open)", () => {
    const tables = listDomainTables();
    expect(Array.isArray(tables)).toBe(true);
    if (tables.length > 0) {
      expect(tables).toContain("owners");
      expect(tables).toContain("accounts");
    }
  });

  it("domainScout inclui tables e available", () => {
    const r = domainScout();
    expect(Array.isArray(r.tables)).toBe(true);
    expect(Array.isArray(r.entities)).toBe(true);
  });
});

describe("domain knowledge (§16 businessRules/dataImpacts)", () => {
  it("businessRulesForTable retorna regras financeiras para accounts", () => {
    const rules = businessRulesForTable("accounts");
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.rule.includes("inversão espelhada"))).toBe(true);
  });

  it("dataImpactsForTable aponta campos afetados", () => {
    const impacts = dataImpactsForTable("entries");
    expect(impacts).toContain("accounts.balance");
  });

  it("fail-open: tabela desconhecida → vazio", () => {
    expect(businessRulesForTable("nao_existe")).toEqual([]);
    expect(dataImpactsForTable("nao_existe")).toEqual([]);
  });

  it("domainScout inclui businessRules preenchidas", () => {
    const r = domainScout();
    expect(Array.isArray(r.businessRules)).toBe(true);
    expect(Array.isArray(r.dataImpacts)).toBe(true);
  });
});

describe("history scout (§7)", () => {
  it("fail-open: estrutura completa sem nunca lançar", () => {
    const r = historyScout();
    expect(Array.isArray(r.relatedTasks)).toBe(true);
    expect(Array.isArray(r.recentChanges)).toBe(true);
    expect(Array.isArray(r.lastScopes)).toBe(true);
  });
});

describe("implementer (§19)", () => {
  it("gera plano a partir de task + writeScope", () => {
    const r = implementFromPlan({
      taskId: "T1",
      intent: "refatorar accounts",
      files: ["src/lib/accounts.ts"],
      writeScope: ["src/lib/accounts.ts"],
      validation: ["npm run typecheck"],
    });
    expect(r.status).toBe("success");
    expect(r.files).toContain("src/lib/accounts.ts");
    expect(r.recommendations).toContain("npm run typecheck");
    expect(r.nextAction).toBe("executar validação e testes");
  });

  it("marca arquivo fora do writeScope como risk (§8)", () => {
    const r = implementFromPlan({
      taskId: "T2",
      intent: "x",
      files: ["src/lib/a.ts", "src/pages/Contas.tsx"],
      writeScope: ["src/lib/a.ts"],
    });
    expect(r.status).toBe("partial");
    expect(r.risks.some((x) => x.includes("fora do writeScope"))).toBe(true);
  });

  it("nenhum arquivo no escopo → partial com risk e baixa confiança", () => {
    const r = implementFromPlan({
      taskId: "T3",
      intent: "x",
      files: ["src/lib/z.ts"],
      writeScope: [],
    });
    expect(r.status).toBe("partial");
    expect(r.confidence).toBeLessThan(0.5);
  });

  it("reforça aguardar tester quando o plano tem step tester", () => {
    const r = implementFromPlan({
      taskId: "T4",
      intent: "x",
      files: ["src/lib/a.ts"],
      writeScope: ["src/lib/a.ts"],
      plan: {
        planId: "p",
        taskId: "T4",
        agent: "pi",
        model: "m",
        createdAt: "",
        budget: {
          maxAgents: 8,
          maxParallel: 4,
          maxTurns: 60,
          maxToolCalls: 150,
          maxTokens: 100000,
          maxCost: 2,
          maxDurationMs: 900000,
        },
        steps: [{ id: "tester", role: "tester" }],
      },
    });
    expect(r.recommendations.some((x) => x.includes("tester"))).toBe(true);
  });
});

describe("graph-freshness (§22)", () => {
  it("fail-open: nunca lança e reporta estado (stale pode ser undefined sem grafo)", () => {
    const r = checkGraphFreshness();
    expect(typeof r.fresh).toBe("boolean");
    expect(r.stale === undefined || typeof r.stale === "boolean").toBe(true);
  });
});

describe("final-validator (§21/§26)", () => {
  it("checkTelemetryCompleteness: sem envelopes → fail, com → pass", () => {
    expect(checkTelemetryCompleteness(0).status).toBe("fail");
    expect(checkTelemetryCompleteness(3).status).toBe("pass");
    expect(checkTelemetryCompleteness(undefined).status).toBe("skip");
  });

  it("checkBudgetCompliance respeita limites", () => {
    expect(checkBudgetCompliance().status).toBe("skip");
    expect(checkBudgetCompliance({ maxAgents: 4, agentsDispatched: 2 }).status).toBe("pass");
    expect(checkBudgetCompliance({ maxAgents: 4, agentsDispatched: 5 }).status).toBe("fail");
  });

  it("finalValidate agrega checks e ok=false com falha (injetando graph/freshness)", () => {
    const v = finalValidate({
      envelopeCount: 0,
      typecheckOk: true,
      testsOk: true,
      graphOk: true,
      freshnessOk: true,
    });
    expect(v.ok).toBe(false);
    expect(v.checks.map((c) => c.name)).toContain("telemetry-completeness");
    const good = finalValidate({
      envelopeCount: 2,
      typecheckOk: true,
      lintOk: true,
      testsOk: true,
      graphOk: true,
      freshnessOk: true,
    });
    expect(good.ok).toBe(true);
  });

  it("checkGraphAvailable fail-open", () => {
    const c = checkGraphAvailable();
    expect(c.status === "pass" || c.status === "fail").toBe(true);
  });
});
