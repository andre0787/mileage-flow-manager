import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { PrsPanel } from "@/components/kpi/PrsPanel";
import type { PrRow } from "@/types/kpi";

const PRS: PrRow[] = [
  {
    number: 370,
    title: "feat(process): otimização do workflow",
    type: "feat",
    date: "2026-08-13",
    tokens: 767,
    benefit: "Nova capacidade entregue e validada",
    impact: "Nova alavanca de uso/negócio",
  },
  {
    number: 369,
    title: "fix(lint): import fs",
    type: "fix",
    date: "2026-08-13",
    tokens: 120,
    benefit: "Comportamento corrigido e validado — menos erro e retrabalho",
    impact: "Menos risco de erro para o usuário e a operação",
  },
];

describe("PrsPanel", () => {
  it("lista entregas com título, tipo e impacto", () => {
    render(createElement(PrsPanel, { prs: PRS }));

    expect(screen.getByText("O que foi entregue")).toBeTruthy();
    expect(screen.getByText("#370")).toBeTruthy();
    expect(screen.getByText(PRS[0].title)).toBeTruthy();
    expect(screen.getByText(PRS[0].benefit)).toBeTruthy();
    expect(screen.getByText(new RegExp(PRS[0].impact.replace("/", "\\/")))).toBeTruthy();
    expect(screen.getByText("feat")).toBeTruthy();
    expect(screen.getByText("fix")).toBeTruthy();
  });

  it("renderiza nada quando não há PRs", () => {
    const { container } = render(createElement(PrsPanel, { prs: [] }));
    expect(container.textContent).toBe("");
  });
});
