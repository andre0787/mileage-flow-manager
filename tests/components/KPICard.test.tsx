import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPICard from "../../src/components/KPICard";

describe("KPICard", () => {
  it("renders label and value", () => {
    render(<KPICard label="Taxa Pre-Pr" value="85.7%" />);
    expect(screen.getByText("Taxa Pre-Pr")).toBeDefined();
    expect(screen.getByText("85.7%")).toBeDefined();
  });

  it("shows positive delta with arrow", () => {
    render(<KPICard label="Taxa" value="90%" delta={10} />);
    expect(screen.getByText("↑ 10%")).toBeDefined();
  });

  it("shows negative delta with arrow", () => {
    render(<KPICard label="Taxa" value="70%" delta={-15} />);
    expect(screen.getByText("↓ 15%")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(
      <KPICard label="Taxa" value="80%" description="5 pass / 2 fail" />
    );
    expect(screen.getByText("5 pass / 2 fail")).toBeDefined();
  });

  it("does not render delta when not provided", () => {
    render(<KPICard label="Taxa" value="80%" />);
    expect(screen.queryByText(/↑|↓/)).toBeNull();
  });
});