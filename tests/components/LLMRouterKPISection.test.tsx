import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LLMRouterKPISection from "../../src/components/LLMRouterKPISection";
import type { RouterMonthlyKPI } from "../../src/components/LLMRouterKPISection";

const fixture: RouterMonthlyKPI = {
  resolved: 4,
  completed: 3,
  failed: 1,
  unobserved: 1,
  fallbackUsed: 1,
  completionRate: 75,
  fallbackRate: 33.3,
  models: ["model/primary", "model/fallback"],
  skillsByModel: [
    { skill: "systematic-debugging", model: "model/primary" },
    { skill: "test-driven-development", model: "model/fallback" },
  ],
};

describe("LLMRouterKPISection", () => {
  it("renderiza ativações, fallback, modelos e skills", () => {
    render(<LLMRouterKPISection llmRouter={fixture} />);

    expect(screen.getByText(/Ativações do Router/i)).toBeDefined();
    expect(screen.getByText(/Uso de Fallback/i)).toBeDefined();
    expect(screen.getAllByText("model/primary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("model/fallback").length).toBeGreaterThan(0);
    expect(screen.getByText("systematic-debugging")).toBeDefined();
    expect(screen.getByText("test-driven-development")).toBeDefined();
    expect(screen.getByText((content) => content.includes("1 rota(s) sem conclusão observada"))).toBeDefined();
  });

  it("mostra estado legado vazio com mensagem explícita", () => {
    render(
      <LLMRouterKPISection
        llmRouter={{
          resolved: 0,
          completed: 0,
          failed: 0,
          unobserved: 0,
          fallbackUsed: 0,
          completionRate: null,
          fallbackRate: null,
          models: [],
          skillsByModel: [],
        }}
      />,
    );

    expect(screen.getByText(/Sem dados do router neste período/i)).toBeDefined();
  });
});
