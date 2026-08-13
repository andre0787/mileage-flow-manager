import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPI from "../../src/pages/KPI";

// Mock fetch to simulate no data
beforeEach(() => {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("No data"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("KPI Page", () => {
  it("shows loading state initially", () => {
    render(<KPI />);
    expect(screen.getByText(/carregando/i)).toBeDefined();
  });

  it("shows fallback when no data after loading", async () => {
    render(<KPI />);
    const fallback = await screen.findByText(/nenhum dado/i);
    expect(fallback).toBeDefined();
  });

  it("mentions npm run data:refresh in fallback", async () => {
    render(<KPI />);
    const kpiHint = await screen.findByText(/npm run data:refresh/);
    expect(kpiHint).toBeDefined();
  });
});
