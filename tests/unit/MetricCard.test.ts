import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { Wallet } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";

// AnimatedNumber usa requestAnimationFrame + performance.now — stubs para sincronismo
// (progress = (now - start)/800 atinge 1 no primeiro frame, evitando recursão)
vi.spyOn(performance, "now").mockReturnValue(0);
vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
  cb(800);
  return 1;
});

describe("MetricCard", () => {
  it("renderiza título e valor", () => {
    render(
      createElement(MetricCard, {
        title: "Total Investido",
        value: 1250,
        subtitle: "Capital aplicado",
        icon: Wallet,
        prefix: "R$",
      }),
    );
    expect(screen.getByText("Total Investido")).toBeTruthy();
    expect(screen.getByText("Capital aplicado")).toBeTruthy();
  });

  it("aplica barra sólida da variante (não gradiente)", () => {
    const { container } = render(
      createElement(MetricCard, {
        title: "Lucro",
        value: 100,
        icon: Wallet,
        variant: "success",
      }),
    );
    const bar = container.querySelector(".absolute.top-0.left-0.right-0");
    expect(bar?.className).toContain("bg-success");
    expect(bar?.className).not.toContain("gradient");
  });

  it("renderiza trend com sinal positivo/negativo", () => {
    const { rerender } = render(
      createElement(MetricCard, {
        title: "Receita",
        value: 500,
        icon: Wallet,
        trend: { value: 12, isPositive: true },
      }),
    );
    expect(screen.getByText(/12%/)).toBeTruthy();
    rerender(
      createElement(MetricCard, {
        title: "Receita",
        value: 500,
        icon: Wallet,
        trend: { value: 8, isPositive: false },
      }),
    );
    expect(screen.getByText(/8%/)).toBeTruthy();
  });
});
