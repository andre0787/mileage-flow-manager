import { describe, expect, it } from "vitest";
import { demoContext, e2eAgentContext, realContext, isAnonymous, TENANTS, ACTORS } from "@/ai/e2e";
import {
  addDemoEntry,
  createDemoFixture,
  isDemoId,
  validateDemoPermissions,
  DEMO_POLICIES,
} from "@/ai/e2e/demo-tenant";
import { DemoAccessGate, DEFAULT_GATE_CONFIG } from "@/ai/e2e/access-gate";
import { DemoLifecycle, evaluateDemoSession, DEMO_SESSION_POLICY } from "@/ai/e2e/lifecycle";
import {
  DemoLimiter,
  DEMO_RATE_LIMITS,
  DEMO_AI_BUDGET,
  type ConsumptionState,
} from "@/ai/e2e/limits";
import { FakeBrowserAdapter, createFakePage } from "@/ai/e2e/fake-browser";
import { isUrlAllowed, runAssertion } from "@/ai/e2e/browser-adapter";
import { SCENARIOS, getScenario, scenarioCoverage } from "@/ai/e2e/scenarios";
import { createEvidencePack, evidenceCompleteness, redact, hasSecretLeak } from "@/ai/e2e/evidence";
import { runScenario } from "@/ai/e2e/qa-agent";
import { classifyFinding, confidenceBand, isBugConfirmed } from "@/ai/e2e/triage";
import {
  proposeFix,
  executeFixWorkflow,
  MAX_AUTONOMY,
  isAutonomyAllowed,
  autonomyLabel,
} from "@/ai/e2e/fix-workflow";
import {
  runRegressionScenario,
  runRegressionSuite,
  isConfirmedRegression,
  DEFAULT_REGRESSION_CONFIG,
} from "@/ai/e2e/regression";
import { computeE2eKpis } from "@/ai/e2e/kpi";
import {
  certify,
  assertTenantIsolation,
  assertNoPrivilegeEscalation,
  canEnableDemo,
  assertPlaywrightIsolation,
} from "@/ai/e2e/security";

describe("P12.5 ExecutionContext", () => {
  it("demo context é anônimo e isolado em __demo__", () => {
    const ctx = demoContext();
    expect(ctx.tenantId).toBe(TENANTS.demo);
    expect(ctx.actorId).toBe(ACTORS.publicDemo);
    expect(ctx.authMode).toBe("anonymous-demo");
    expect(isAnonymous(ctx)).toBe(true);
    expect(ctx.dataPolicy.canAccessProductionData).toBe(false);
  });

  it("demo nunca tem admin nem editCode (T6)", () => {
    const ctx = demoContext();
    expect(ctx.permissions.admin).toBe(false);
    expect(ctx.permissions.editCode).toBe(false);
    expect(ctx.permissions.export).toBe(false);
  });

  it("QA Agent não edita código nem exporta (P12.5-08)", () => {
    const ctx = e2eAgentContext();
    expect(ctx.tenantId).toBe(TENANTS.e2e);
    expect(ctx.actorType).toBe("agent");
    expect(ctx.permissions.editCode).toBe(false);
    expect(ctx.permissions.export).toBe(false);
  });

  it("usuário real é autenticado e acessa dados de produção", () => {
    const ctx = realContext("user_1", "tenant_1");
    expect(ctx.authMode).toBe("authenticated");
    expect(isAnonymous(ctx)).toBe(false);
    expect(ctx.dataPolicy.canAccessProductionData).toBe(true);
  });

  it("nunca transforma anônimo em autenticado (princípio 1)", () => {
    const demo = demoContext();
    const real = realContext("x", "y");
    expect(demo.tenantId).not.toBe(real.tenantId);
    expect(demo.authMode).not.toBe("authenticated");
  });
});

describe("P12.5 Demo Tenant", () => {
  it("fixture determinística com IDs de prefixo reservado", () => {
    const fixture = createDemoFixture();
    expect(fixture.accounts.length).toBe(2);
    expect(fixture.entries.length).toBe(3);
    expect(fixture.accounts.every((a) => isDemoId(a.id))).toBe(true);
    expect(fixture.entries.every((e) => isDemoId(e.id))).toBe(true);
  });

  it("addDemoEntry valida tenant (T4 IDOR) e atualiza saldo", () => {
    const fixture = createDemoFixture();
    expect(() =>
      addDemoEntry(fixture, {
        accountId: "real_account_1",
        date: "2026-08-04",
        miles: 100,
        description: "x",
        origem: "Compra",
      }),
    ).toThrow(/outside demo tenant/);

    const next = addDemoEntry(fixture, {
      accountId: fixture.accounts[0].id,
      date: "2026-08-04",
      miles: 500,
      description: "Demo novo",
      origem: "Compra",
    });
    expect(next.entries.length).toBe(4);
    expect(next.accounts[0].balance).toBe(fixture.accounts[0].balance + 500);
  });

  it("validateDemoPermissions respeita as políticas (export/admin false)", () => {
    expect(validateDemoPermissions({ ...DEMO_POLICIES, export: false, admin: false })).toBe(true);
    expect(validateDemoPermissions({ ...DEMO_POLICIES, export: true })).toBe(false);
  });
});

describe("P12.5 Demo Access Gate", () => {
  it("bloqueia quando PUBLIC_DEMO_ENABLED=false", () => {
    const gate = new DemoAccessGate();
    const d = gate.decide("s1");
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toContain("disabled");
  });

  it("permite anônimo quando habilitado e aplica rate limit", () => {
    const gate = new DemoAccessGate({
      ...DEFAULT_GATE_CONFIG,
      enabled: true,
      maxRequestsPerMinute: 2,
    });
    expect(gate.decide("s1", "ip1").allowed).toBe(true);
    expect(gate.decide("s1", "ip1").allowed).toBe(true);
    const third = gate.decide("s1", "ip1");
    expect(third.allowed).toBe(false);
    if (!third.allowed) expect(third.reason).toContain("rate limit");
  });

  it("aplica rate limit por IP independente da session", () => {
    const gate = new DemoAccessGate({
      ...DEFAULT_GATE_CONFIG,
      enabled: true,
      maxRequestsPerMinutePerIp: 1,
    });
    expect(gate.decide("s1", "ip-x").allowed).toBe(true);
    const d2 = gate.decide("s2", "ip-x");
    expect(d2.allowed).toBe(false);
    if (!d2.allowed) expect(d2.reason).toContain("(ip)");
  });

  it("gate permitido resolve para contexto demo (P12.5-02)", () => {
    const gate = new DemoAccessGate({ ...DEFAULT_GATE_CONFIG, enabled: true });
    const d = gate.decide("s-demo", "10.0.0.1");
    expect(d.allowed).toBe(true);
    if (d.allowed) {
      expect(d.context.tenantId).toBe(TENANTS.demo);
      expect(d.context.authMode).toBe("anonymous-demo");
    }
  });
});

describe("P12.5 Demo Lifecycle", () => {
  it("reset restaura fixture determinística (P12.5-03)", () => {
    const lc = new DemoLifecycle();
    lc.mutate((d) => ({
      ...d,
      entries: [
        ...d.entries,
        {
          id: "demo_x",
          accountId: d.accounts[0].id,
          date: "2026-08-05",
          miles: 1,
          description: "x",
          origem: "Compra",
        },
      ],
    }));
    expect(lc.isPristine()).toBe(false);
    const res = lc.reset();
    expect(res.ok).toBe(true);
    expect(res.sessionReset).toBe(true);
    expect(res.cacheInvalidated).toBe(true);
    expect(res.telemetryEmitted).toBe(true);
    expect(lc.isPristine()).toBe(true);
  });

  it("evaluateDemoSession aplica TTL/idle/max-lifetime (T2)", () => {
    const now = 1_000_000;
    expect(
      evaluateDemoSession(DEMO_SESSION_POLICY, {
        now,
        startedAt: now - 10_000,
        lastActivityAt: now,
      }).ok,
    ).toBe(true);
    expect(
      evaluateDemoSession(DEMO_SESSION_POLICY, {
        now,
        startedAt: now - DEMO_SESSION_POLICY.maxLifetimeMs - 1,
        lastActivityAt: now,
      }).ok,
    ).toBe(false);
    expect(
      evaluateDemoSession(DEMO_SESSION_POLICY, {
        now,
        startedAt: now - 10_000,
        lastActivityAt: now - DEMO_SESSION_POLICY.idleTimeoutMs - 1,
      }).ok,
    ).toBe(false);
    expect(
      evaluateDemoSession(DEMO_SESSION_POLICY, {
        now,
        startedAt: now - DEMO_SESSION_POLICY.sessionTtlMs - 1,
        lastActivityAt: now,
      }).ok,
    ).toBe(false);
  });
});

describe("P12.5 Limits", () => {
  const state = (over: Partial<ConsumptionState> = {}): ConsumptionState => ({
    requestsThisMinute: 0,
    workflowRunsThisHour: 0,
    aiExecutionsThisHour: 0,
    activeExecutions: 0,
    tokensUsed: 0,
    toolCallsUsed: 0,
    activeWorkflows: 0,
    runsUsed: 0,
    sessionStartedAt: Date.now(),
    ...over,
  });

  it("bloqueia quando requests/min excede (T7)", () => {
    const limiter = new DemoLimiter();
    const v = limiter.check(
      state({ requestsThisMinute: DEMO_RATE_LIMITS.maxRequestsPerMinute }),
      Date.now(),
      100,
    );
    expect(v.allowed).toBe(false);
  });

  it("bloqueia quando tokens excedem o budget (T9)", () => {
    const limiter = new DemoLimiter();
    const v = limiter.check(state({ tokensUsed: DEMO_AI_BUDGET.maxTokens }), Date.now(), 100);
    expect(v.allowed).toBe(false);
    if (!v.allowed) expect(v.violated).toBe("maxTokens");
  });

  it("bloqueia payload acima do limite (T11)", () => {
    const limiter = new DemoLimiter();
    const v = limiter.check(state(), Date.now(), DEMO_RATE_LIMITS.maxPayloadSizeBytes + 1);
    expect(v.allowed).toBe(false);
    if (!v.allowed) expect(v.violated).toBe("maxPayloadSizeBytes");
  });

  it("permite consumo normal", () => {
    const limiter = new DemoLimiter();
    expect(limiter.check(state(), Date.now(), 100).allowed).toBe(true);
  });
});

describe("P12.5 BrowserAdapter", () => {
  it("sandbox bloqueia URL fora do domínio (T18 SSRF)", () => {
    expect(isUrlAllowed("http://localhost:8080/demo")).toBe(true);
    expect(isUrlAllowed("http://evil.example.com")).toBe(false);
  });

  it("fake browser aplica o mesmo sandbox", async () => {
    const page = createFakePage();
    const adapter = new FakeBrowserAdapter(page);
    await expect(adapter.open("http://evil.example.com")).rejects.toThrow(/sandbox/);
    await adapter.open("http://localhost:8080/demo");
    expect(await adapter.currentUrl()).toBe("http://localhost:8080/demo");
  });

  it("runAssertion compara texto e URL", async () => {
    expect(
      (await runAssertion({ type: "text", selector: "#x", expected: "abc" }, "hello abc")).passed,
    ).toBe(true);
    expect(
      (await runAssertion({ type: "url", pattern: "/demo$" }, "http://localhost:8080/demo")).passed,
    ).toBe(true);
  });
});

describe("P12.5 Scenario Registry", () => {
  it("registry tem cenários essenciais", () => {
    const ids = SCENARIOS.map((s) => s.scenarioId);
    expect(ids).toContain("create-mileage-entry");
    expect(ids).toContain("demo-access");
    expect(ids).toContain("demo-reset");
    expect(getScenario("create-mileage-entry")?.risk).toBe("medium");
  });

  it("cobertura por prioridade", () => {
    const cov = scenarioCoverage();
    expect(cov.P0).toBeGreaterThan(0);
    expect(cov.P1).toBeGreaterThanOrEqual(cov.P2);
  });
});

describe("P12.5 Evidence", () => {
  it("redact remove secrets (T19)", () => {
    expect(redact("token=abc123")).toContain("[REDACTED]");
    expect(redact("password=secret")).toContain("[REDACTED]");
    expect(redact("normal text")).toBe("normal text");
  });

  it("evidence pack completo atende meta ≥ 99,5%", () => {
    const pack = createEvidencePack({
      findingId: "f1",
      runId: "r1",
      scenarioId: "create-mileage-entry",
      commitSha: "abc123",
      environment: "dev",
      browser: "fake",
      url: "http://localhost:8080/demo",
      preconditions: ["demo loaded"],
      steps: ["open /demo"],
      expected: "entry appears",
      actual: "HTTP 500",
      severity: "high",
      screenshots: [{ name: "s.png", contentType: "image/png" }],
      consoleLogs: [{ level: "error", text: "err" }],
    });
    expect(evidenceCompleteness(pack)).toBeGreaterThanOrEqual(99.5);
    expect(hasSecretLeak(pack)).toBe(false);
  });

  it("evidence sem secrets vazados mesmo com texto suspeito", () => {
    const pack = createEvidencePack({
      findingId: "f2",
      runId: "r2",
      scenarioId: "demo-access",
      commitSha: "sha",
      environment: "dev",
      browser: "fake",
      url: "http://localhost:8080/demo",
      preconditions: [],
      steps: [],
      expected: "ok",
      actual: "ok",
      severity: "info",
      consoleLogs: [{ level: "log", text: "password= hunter2" }],
    });
    expect(pack.redacted).toBe(true);
    expect(hasSecretLeak(pack)).toBe(false);
  });
});

describe("P12.5 QA Agent", () => {
  it("cenário que passa gera finding sem erro", async () => {
    const scenario = getScenario("dashboard-totals")!;
    const page = createFakePage({
      textBySelector: new Map([["#dashboard-total", "41.400"]]),
      visibleSelectors: new Set(["#dashboard-total"]),
    });
    const adapter = new FakeBrowserAdapter(page);
    const finding = await runScenario(adapter, {
      runId: "r1",
      commitSha: "sha",
      environment: "dev",
      browser: "fake",
      scenario,
    });
    expect(finding.passed).toBe(true);
    expect(finding.evidence.redacted).toBe(true);
  });

  it("HTTP 500 no submit gera finding fail com severidade (P12.5-07 exemplo)", async () => {
    const scenario = getScenario("create-mileage-entry")!;
    const page = createFakePage({
      failOn: { click: "#submit-entry" },
      countsBySelector: new Map([["#entry-list tr", 0]]),
      textBySelector: new Map([["#dashboard-total", "error"]]),
    });
    const adapter = new FakeBrowserAdapter(page);
    const finding = await runScenario(adapter, {
      runId: "r-fail",
      commitSha: "sha",
      environment: "dev",
      browser: "fake",
      scenario,
    });
    expect(finding.passed).toBe(false);
    expect(finding.evidence.actual).toContain("HTTP 500");
    expect(finding.evidence.screenshots.length).toBe(1);
    expect(finding.evidence.traces.length).toBe(1);
  });
});

describe("P12.5 Triage", () => {
  it("HTTP 500 → api_bug com confidence ≥ 0.90 → bug confirmado", () => {
    const pack = createEvidencePack({
      findingId: "f-api",
      runId: "r",
      scenarioId: "create-mileage-entry",
      commitSha: "sha",
      environment: "dev",
      browser: "fake",
      url: "http://localhost:8080/demo",
      preconditions: [],
      steps: ["submit"],
      expected: "entry appears",
      actual: "HTTP 500 after submit",
      severity: "high",
      networkEvents: [
        {
          url: "http://localhost:8080/api",
          method: "POST",
          status: 500,
          responseBodyRedacted: true,
        },
      ],
    });
    const t = classifyFinding(pack);
    expect(t.classification).toBe("api_bug");
    expect(t.confidence).toBeGreaterThanOrEqual(0.9);
    expect(confidenceBand(t.confidence)).toBe("high");
    expect(isBugConfirmed(t)).toBe(true);
  });

  it("evidência insuficiente → unknown com baixa confiança → manual review (T21)", () => {
    const pack = createEvidencePack({
      findingId: "f-unknown",
      runId: "r",
      scenarioId: "demo-access",
      commitSha: "sha",
      environment: "dev",
      browser: "fake",
      url: "http://localhost:8080/demo",
      preconditions: [],
      steps: [],
      expected: "ok",
      actual: "something unexpected happened",
      severity: "medium",
    });
    const t = classifyFinding(pack);
    expect(t.classification).toBe("unknown");
    expect(t.recommendedNextAction).toBe("manual_review");
    expect(isBugConfirmed(t)).toBe(false);
  });

  it("autorização negada → authorization_bug", () => {
    const pack = createEvidencePack({
      findingId: "f-auth",
      runId: "r",
      scenarioId: "demo-access",
      commitSha: "sha",
      environment: "dev",
      browser: "fake",
      url: "http://localhost:8080/demo",
      preconditions: [],
      steps: [],
      expected: "ok",
      actual: "403 forbidden",
      severity: "high",
      networkEvents: [
        {
          url: "http://localhost:8080/api",
          method: "GET",
          status: 403,
          responseBodyRedacted: true,
        },
      ],
    });
    const t = classifyFinding(pack);
    expect(t.classification).toBe("authorization_bug");
  });
});

describe("P12.5 Fix Workflow", () => {
  it("proposta é smallest safe fix sem refactor amplo", () => {
    const pack = createEvidencePack({
      findingId: "f1",
      runId: "r",
      scenarioId: "create-mileage-entry",
      commitSha: "sha",
      environment: "dev",
      browser: "fake",
      url: "http://localhost:8080/demo",
      preconditions: [],
      steps: [],
      expected: "ok",
      actual: "HTTP 500",
      severity: "high",
    });
    const t = classifyFinding(pack);
    const proposal = proposeFix({
      finding: pack,
      triage: t,
      relevantFiles: ["a.ts"],
      graphContext: [],
      domainContext: [],
      testContext: [],
    });
    expect(proposal.findingId).toBe("f1");
    expect(proposal.regressionScenarios).toContain("create-mileage-entry");
  });

  it("execução termina no Level 3 SEM auto-merge (T22)", () => {
    const pack = createEvidencePack({
      findingId: "f2",
      runId: "r",
      scenarioId: "create-mileage-entry",
      commitSha: "sha",
      environment: "dev",
      browser: "fake",
      url: "http://localhost:8080/demo",
      preconditions: [],
      steps: [],
      expected: "ok",
      actual: "HTTP 500",
      severity: "high",
    });
    const t = classifyFinding(pack);
    const { execution, levelReached } = executeFixWorkflow(
      {
        finding: pack,
        triage: t,
        relevantFiles: ["b.ts"],
        graphContext: [],
        domainContext: [],
        testContext: [],
      },
      { unitTestsPassed: true, e2eRegressionPassed: true, reviewerApproved: true, prCreated: true },
    );
    expect(levelReached).toBe(MAX_AUTONOMY);
    expect(isAutonomyAllowed(levelReached)).toBe(true);
    expect(execution.merged).toBe(false);
    expect(execution.deployed).toBe(false);
    expect(autonomyLabel(4)).toContain("auto-merge");
  });

  it("Level 4 não é permitido", () => {
    expect(isAutonomyAllowed(4)).toBe(false);
  });
});

describe("P12.5 Regression Loop", () => {
  it("flaky_score classifica flaky quando misto (T20)", () => {
    const run = runRegressionScenario("x", 3, [true, false, true]);
    expect(run.verdict).toBe("flaky");
    // flakyScore = proporção do outcome minoritário (1/3) — > 0 indica mistura
    expect(run.flakyScore).toBeGreaterThan(0);
  });

  it("falha em todas as repetições confirma regressão", () => {
    const run = runRegressionScenario("x", DEFAULT_REGRESSION_CONFIG.repeatOnFailure, [
      false,
      false,
      false,
    ]);
    expect(run.verdict).toBe("fail");
    expect(isConfirmedRegression(run)).toBe(true);
  });

  it("uma única falha com sucessos não confirma bug (T20)", () => {
    const run = runRegressionScenario("x", 3, [true, true, false]);
    expect(run.verdict).toBe("flaky");
    expect(isConfirmedRegression(run)).toBe(false);
  });

  it("suíte de regressão retorna fix quando confirmado", () => {
    const suite = runRegressionSuite(
      { "create-mileage-entry": [false, false, false], "dashboard-totals": [true, true, true] },
      ["demo-reset"],
    );
    expect(suite.needsFixReturn).toBe(true);
    expect(suite.regressionsConfirmed).toContain("create-mileage-entry");
    expect(suite.flakyCount).toBe(0);
  });
});

describe("P12.5 KPI", () => {
  it("computeE2eKpis calcula pass/failure/fix success", () => {
    const kpis = computeE2eKpis({
      findings: [
        {
          findingId: "a",
          runId: "r",
          scenarioId: "s1",
          severity: "info",
          evidence: undefined as never,
          passed: true,
          classification: undefined,
        },
        {
          findingId: "b",
          runId: "r",
          scenarioId: "s2",
          severity: "high",
          evidence: undefined as never,
          passed: false,
          classification: undefined,
        },
      ],
      triages: [
        {
          findingId: "b",
          classification: "api_bug",
          severity: "high",
          confidence: 0.91,
          rootCauseHypothesis: "x",
          affectedArea: "api",
          recommendedNextAction: "fix",
          evidence: [],
        },
      ],
      regression: {
        runs: [],
        totalPass: 1,
        totalFail: 1,
        flakyCount: 0,
        regressionsConfirmed: [],
        needsFixReturn: false,
      },
      fixOutcomes: [{ success: true }],
      totalDurationMs: 2_400,
    });
    expect(kpis.passRate).toBe(50);
    expect(kpis.failureRate).toBe(50);
    expect(kpis.highFindings).toBe(1);
    expect(kpis.fixSuccessRate).toBe(100);
  });
});

describe("P12.5 Security Certification", () => {
  it("assertTenantIsolation impede escape (T3)", () => {
    const demo = demoContext();
    expect(assertTenantIsolation(demo, TENANTS.demo)).toBe(true);
    expect(assertTenantIsolation(demo, "real-tenant")).toBe(false);
  });

  it("assertNoPrivilegeEscalation (T6)", () => {
    expect(assertNoPrivilegeEscalation(demoContext())).toBe(true);
    expect(assertNoPrivilegeEscalation(realContext("u", "t"))).toBe(true);
  });

  it("canEnableDemo exige todos os requisitos", () => {
    const ok = {
      anonymousAccessIsolated: true,
      tenantIsolated: true,
      rlsEnforced: true,
      permissionsRestricted: true,
      rateLimitActive: true,
      aiBudgetActive: true,
      sessionTtlActive: true,
      secretsInaccessible: true,
      adminInaccessible: true,
    };
    expect(canEnableDemo(ok)).toBe(true);
    expect(canEnableDemo({ ...ok, rateLimitActive: false })).toBe(false);
  });

  it("assertPlaywrightIsolation valida isolamento completo", () => {
    const ok = {
      anonymousCannotAccessPrivateTenant: true,
      demoCannotAccessAdmin: true,
      demoCannotAccessAnotherDemo: true,
      demoCannotAccessProductionUser: true,
      qaCannotAccessSecrets: true,
      qaCannotEscapeBrowserSandbox: true,
    };
    expect(assertPlaywrightIsolation(ok)).toBe(true);
    expect(assertPlaywrightIsolation({ ...ok, qaCannotEscapeBrowserSandbox: false })).toBe(false);
  });

  it("certify passa com 16/16 e autonomia ≤ 3", () => {
    const cert = certify(
      demoContext(),
      {
        tenantEscape: false,
        idor: false,
        rlsBypass: false,
        privilegeEscalation: false,
        anonymousAbuse: false,
        rateLimit: true,
        sessionExpiry: true,
        csrf: false,
        xss: false,
        ssrf: false,
        promptInjection: false,
        aiBudgetExhaustion: false,
        secretExposure: false,
        fileUploadAbuse: false,
        exportAbuse: false,
      },
      3,
    );
    expect(cert.allPassed).toBe(true);
    expect(cert.autonomyCapped).toBe(true);
    expect(cert.checks.length).toBe(16);
  });

  it("autonomia Level 4 falha a certificação (T22)", () => {
    const cert = certify(
      demoContext(),
      {
        tenantEscape: false,
        idor: false,
        rlsBypass: false,
        privilegeEscalation: false,
        anonymousAbuse: false,
        rateLimit: true,
        sessionExpiry: true,
        csrf: false,
        xss: false,
        ssrf: false,
        promptInjection: false,
        aiBudgetExhaustion: false,
        secretExposure: false,
        fileUploadAbuse: false,
        exportAbuse: false,
      },
      4,
    );
    expect(cert.allPassed).toBe(false);
    expect(cert.autonomyCapped).toBe(false);
  });
});
