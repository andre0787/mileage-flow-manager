import { describe, it, expect } from "vitest";
import { parseSaleCosts, applyAdditionalCosts } from "@/lib/saleCosts";

describe("parseSaleCosts", () => {
  it("retorna [] para entrada não-array", () => {
    expect(parseSaleCosts(null)).toEqual([]);
    expect(parseSaleCosts("x")).toEqual([]);
  });

  it("normaliza itens válidos e filtra inválidos", () => {
    expect(
      parseSaleCosts([{ desc: "Taxa", amount: 59.46 }, { desc: "Ruim", amount: "x" }, null, {}]),
    ).toEqual([{ desc: "Taxa", amount: 59.46 }]);
  });
});

describe("applyAdditionalCosts", () => {
  it("preenche costs/soma/descricao no payload", () => {
    const update: Record<string, unknown> = {};
    applyAdditionalCosts(update, [
      { desc: "Taxa", amount: 10 },
      { desc: "Outro", amount: 5 },
    ]);
    expect(update.additional_costs).toHaveLength(2);
    expect(update.additional_cost).toBe(15);
    expect(update.additional_cost_desc).toBe("Taxa: 10; Outro: 5");
  });

  it("entrada não-array zera os campos", () => {
    const update: Record<string, unknown> = {};
    applyAdditionalCosts(update, null);
    expect(update.additional_costs).toEqual([]);
    expect(update.additional_cost).toBe(0);
    expect(update.additional_cost_desc).toBe("");
  });
});
