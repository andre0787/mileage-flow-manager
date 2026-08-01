import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  CAPABILITIES,
  RouterConfigError,
  assertValidRouterConfig,
  createCompletedEvent,
  createResolvedEvent,
  normalizeTaskContext,
  resolveRoute,
  validateRouterConfig,
} from "../../scripts/lib/llm-router.mjs";

const config = {
  version: 1,
  aliases: {
    primary: "model/primary",
    fallback: "model/fallback",
    review: "model/review",
  },
  profiles: {
    coding: { primary: "primary", fallbacks: ["fallback"] },
    reasoning: { primary: "review", fallbacks: [] },
    efficient: { primary: "fallback", fallbacks: [] },
  },
  categoryDefaults: {
    feature: "coding",
    bugfix: "reasoning",
    docs: "efficient",
    refactor: "coding",
    chore: "efficient",
  },
  globalDefault: "efficient",
  routes: [
    { category: "feature", capability: "review", profile: "reasoning" },
    { category: "bugfix", capability: "debugging", profile: "reasoning" },
  ],
};

const context = (overrides = {}) =>
  normalizeTaskContext({
    taskId: "P1-ROUTER",
    category: "feature",
    retrySafety: "read-only",
    source: "orchestrator-inference",
    ...overrides,
  });

describe("llm-router contract", () => {
  it("expõe os vocabulários declarativos aprovados", () => {
    expect(CATEGORIES).toEqual(["feature", "bugfix", "docs", "refactor", "chore"]);
    expect(CAPABILITIES).toContain("visual-inspection");
  });

  it("rejeita fallback que não existe em aliases", () => {
    expect(() =>
      assertValidRouterConfig({
        ...config,
        profiles: { coding: { primary: "primary", fallbacks: ["missing"] } },
      }),
    ).toThrow(/fallback.*missing/i);
  });

  it("rejeita versão ausente", () => {
    const { version: _version, ...withoutVersion } = config;
    expect(() => assertValidRouterConfig(withoutVersion)).toThrow(/version/i);
  });

  it("agrega problemas estruturais sem corrigir a configuração", () => {
    const invalid = {
      ...config,
      version: 2,
      aliases: { primary: "" },
      categoryDefaults: { invalid: "missing" },
      globalDefault: "missing",
      routes: [
        { category: "feature", capability: "review", profile: "coding" },
        { category: "feature", capability: "review", profile: "coding" },
      ],
    };

    const issues = validateRouterConfig(invalid);
    expect(issues.length).toBeGreaterThanOrEqual(4);
    expect(() => assertValidRouterConfig(invalid)).toThrow(RouterConfigError);
    expect(invalid.version).toBe(2);
  });

  it("rejeita fallback duplicado e fallback igual ao primary", () => {
    expect(
      validateRouterConfig({
        ...config,
        profiles: {
          coding: { primary: "primary", fallbacks: ["primary", "fallback", "fallback"] },
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/fallback.*primary/i),
        expect.stringMatching(/duplic/i),
      ]),
    );
  });

  it("normaliza contexto e aplica defaults seguros", () => {
    expect(normalizeTaskContext({ taskId: " x ", category: " FEATURE " })).toEqual({
      taskId: "x",
      category: "feature",
      retrySafety: "may-write",
      source: "orchestrator-inference",
    });
  });

  it("rejeita categoria, capability, origem e retry safety inválidos", () => {
    expect(() => normalizeTaskContext({ taskId: "x", category: "unknown" })).toThrow(/category/i);
    expect(() =>
      normalizeTaskContext({ taskId: "x", category: "feature", capability: "unknown" }),
    ).toThrow(/capability/i);
    expect(() =>
      normalizeTaskContext({ taskId: "x", category: "feature", source: "unknown" }),
    ).toThrow(/source/i);
    expect(() =>
      normalizeTaskContext({ taskId: "x", category: "feature", retrySafety: "retry" }),
    ).toThrow(/retrySafety/i);
  });

  it("usa a rota category + capability antes do default da categoria", () => {
    expect(resolveRoute(context({ capability: "review" }), config)).toEqual({
      profile: "reasoning",
      model: "model/review",
      fallbackModels: [],
      source: "category-capability",
      retrySafety: "read-only",
    });
  });

  it("usa o default da categoria quando capability está ausente", () => {
    expect(resolveRoute(context(), config)).toMatchObject({
      profile: "coding",
      model: "model/primary",
      fallbackModels: ["model/fallback"],
      source: "category-default",
    });
  });

  it("usa o default global quando a categoria não possui default", () => {
    const sparseConfig = { ...config, categoryDefaults: { feature: "coding" } };
    expect(resolveRoute(context({ category: "chore" }), sparseConfig)).toMatchObject({
      profile: "efficient",
      model: "model/fallback",
      source: "global-default",
    });
  });

  it("prioriza override manual sobre todas as rotas", () => {
    expect(
      resolveRoute(
        context({
          modelProfileOverride: "reasoning",
          source: "manual",
          capability: "review",
        }),
        config,
      ),
    ).toMatchObject({
      profile: "reasoning",
      model: "model/review",
      source: "manual",
    });
  });

  it("prioriza override de task-card e aceita alias validado", () => {
    expect(
      resolveRoute(
        context({
          modelProfileOverride: "fallback",
          source: "task-card",
          capability: "review",
        }),
        config,
      ),
    ).toEqual({
      profile: "fallback",
      model: "model/fallback",
      fallbackModels: [],
      source: "task-card",
      retrySafety: "read-only",
    });
  });

  it("rejeita override desconhecido antes de escolher outro profile", () => {
    expect(() =>
      resolveRoute(
        context({
          modelProfileOverride: "not-configured",
          source: "manual",
        }),
        config,
      ),
    ).toThrow(/profile|alias/i);
  });

  it("expande aliases e preserva a ordem dos fallbacks", () => {
    const decision = resolveRoute(context(), config);
    expect(decision.model).toBe(config.aliases.primary);
    expect(decision.fallbackModels).toEqual([config.aliases.fallback]);
  });

  it("preserva read-only e may-write na decisão", () => {
    expect(resolveRoute(context({ retrySafety: "read-only" }), config).retrySafety).toBe(
      "read-only",
    );
    expect(resolveRoute(context({ retrySafety: "may-write" }), config).retrySafety).toBe(
      "may-write",
    );
  });

  it("produz a mesma decisão para o mesmo contexto e configuração", () => {
    const first = resolveRoute(context({ capability: "review" }), config);
    const second = resolveRoute(context({ capability: "review" }), config);
    expect(second).toEqual(first);
  });

  it("gera evento de resolução sem conteúdo sensível", () => {
    const taskContext = context({ capability: "review" });
    const decision = resolveRoute(taskContext, config);
    const event = createResolvedEvent(taskContext, decision);

    expect(event).toEqual({
      type: "llm.route.resolved",
      taskId: "P1-ROUTER",
      category: "feature",
      capability: "review",
      profile: "reasoning",
      model: "model/review",
      fallbackModels: [],
      source: "category-capability",
      retrySafety: "read-only",
      configVersion: 1,
    });
    expect(JSON.stringify(event)).not.toMatch(/prompt|response|output|token|secret/i);
  });

  it("gera evento de conclusão somente com metadados permitidos", () => {
    expect(
      createCompletedEvent({
        taskId: "P1-ROUTER",
        model: "model/primary",
        provider: "local",
        attempt: 2,
        status: "failed",
        durationMs: 1200,
        failureKind: "transient-provider",
      }),
    ).toEqual({
      type: "llm.route.completed",
      taskId: "P1-ROUTER",
      model: "model/primary",
      provider: "local",
      attempt: 2,
      status: "failed",
      durationMs: 1200,
      failureKind: "transient-provider",
    });
  });

  it("rejeita prompt, input, output, resposta e credenciais no evento", () => {
    for (const field of ["prompt", "input", "output", "response", "token", "apiKey", "password"]) {
      expect(() =>
        createCompletedEvent({
          taskId: "P1-ROUTER",
          model: "model/primary",
          status: "completed",
          [field]: "sensitive",
        }),
      ).toThrow(new RegExp(field, "i"));
    }
  });
});
