import { describe, it, expect } from "vitest";
import { planStatusTransition } from "@/lib/saleStatus";

describe("planStatusTransition", () => {
  it("planeja transição quando o status muda", () => {
    expect(planStatusTransition("pendente", "pago")).toEqual({ from: "pendente", to: "pago" });
  });

  it("retorna null quando o status é igual", () => {
    expect(planStatusTransition("pago", "pago")).toBeNull();
  });

  it("retorna null com valores vazios ou não-string", () => {
    expect(planStatusTransition("", "pago")).toBeNull();
    expect(planStatusTransition("pendente", "")).toBeNull();
    expect(planStatusTransition(null, "pago")).toBeNull();
    expect(planStatusTransition("pendente", undefined)).toBeNull();
  });

  it("apara espaços antes de comparar", () => {
    expect(planStatusTransition(" pago ", "pago")).toBeNull();
  });
});
