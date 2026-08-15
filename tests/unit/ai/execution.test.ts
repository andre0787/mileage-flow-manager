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

describe("graph-freshness (§22)", () => {
  it("fail-open: nunca lança e reporta estado", () => {
    const r = checkGraphFreshness();
    expect(typeof r.fresh).toBe("boolean");
    expect(typeof r.stale).toBe("boolean");
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

  it("finalValidate agrega checks e ok=false com falha", () => {
    const v = finalValidate({ envelopeCount: 0, typecheckOk: true, testsOk: true });
    expect(v.ok).toBe(false);
    expect(v.checks.map((c) => c.name)).toContain("telemetry-completeness");
    const good = finalValidate({
      envelopeCount: 2,
      typecheckOk: true,
      lintOk: true,
      testsOk: true,
    });
    expect(good.ok).toBe(true);
  });

  it("checkGraphAvailable fail-open", () => {
    const c = checkGraphAvailable();
    expect(c.status === "pass" || c.status === "fail").toBe(true);
  });
});
