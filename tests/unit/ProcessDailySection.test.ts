import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { ProcessDailySection } from "@/components/kpi/ProcessDailySection";
import type { DailyMetric } from "@/types/kpi";

vi.mock("@/components/AnimatedNumber", () => ({
  AnimatedNumber: ({ value }: { value: number }) => String(value),
}));

const DAILY: DailyMetric[] = [
  {
    day: "2026-07-31",
    label: "31/07",
    prePrTotal: 20,
    prePrPass: 18,
    prePrFail: 2,
    prePrPassRate: 90,
    ruleFails: 5,
    healed: 2,
    sessions: 3,
    merges: 4,
    friction: 0.28,
  },
  {
    day: "2026-08-01",
    label: "01/08",
    prePrTotal: 25,
    prePrPass: 25,
    prePrFail: 0,
    prePrPassRate: 100,
    ruleFails: 8,
    healed: 4,
    sessions: 5,
    merges: 6,
    friction: 0.32,
  },
];

describe("ProcessDailySection", () => {
  it("renderiza o radar com chips do dia atual", () => {
    render(createElement(ProcessDailySection, { daily: DAILY }));

    expect(screen.getByText("Radar do workflow")).toBeTruthy();
    expect(screen.getByText(/hoje: 25 pre-pr · 6 merges/)).toBeTruthy();
    expect(screen.getByText("8 violações")).toBeTruthy();
    expect(screen.getByText("4 auto-correções")).toBeTruthy();
  });

  it("renderiza os títulos dos gráficos", () => {
    render(createElement(ProcessDailySection, { daily: DAILY }));

    expect(screen.getByText("📡 Taxa de pre-pr por dia")).toBeTruthy();
    expect(screen.getByText("🛡️ Fricção: violações × auto-correções")).toBeTruthy();
  });

  it("expõe o seletor de janela 7/14/30 dias", () => {
    render(createElement(ProcessDailySection, { daily: DAILY }));

    expect(screen.getByText("7d")).toBeTruthy();
    expect(screen.getByText("14d")).toBeTruthy();
    expect(screen.getByText("30d")).toBeTruthy();
  });
});
