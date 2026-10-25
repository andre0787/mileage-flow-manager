import { describe, it, expect } from "vitest";
import { getSaleSortValue } from "@/components/sales/saleSort";
import type { Sale } from "@/types";

const mockSale: Sale = {
  id: "sale-1",
  date: "2025-01-15",
  ownerName: "João",
  program: "Smiles",
  clientName: "Maria Silva",
  ticketLocator: "ABC123",
  milesUsed: 50000,
  costPerThousand: 15.5,
  totalCost: 775,
  pricePerThousand: 22.0,
  saleValue: 1100,
  amountReceived: 500,
  profit: 325,
  profitMargin: 29.54,
  status: "pendente",
  passengers: [{ name: "Maria Silva" }],
  createdAt: "2025-01-15T10:00:00Z",
};

describe("getSaleSortValue", () => {
  it("returns correct sort values for each column key", () => {
    expect(getSaleSortValue(mockSale, "Data")).toBe(new Date("2025-01-15").getTime());
    expect(getSaleSortValue(mockSale, "Dono")).toBe("joão");
    expect(getSaleSortValue(mockSale, "Programa")).toBe("smiles");
    expect(getSaleSortValue(mockSale, "Cliente")).toBe("maria silva");
    expect(getSaleSortValue(mockSale, "Milhas")).toBe(50000);
    expect(getSaleSortValue(mockSale, "Valor")).toBe(1100);
    expect(getSaleSortValue(mockSale, "Pendente")).toBe(600);
    expect(getSaleSortValue(mockSale, "Lucro")).toBe(325);
    expect(getSaleSortValue(mockSale, "Margem")).toBe(29.54);
    expect(getSaleSortValue(mockSale, "Status")).toBe("pendente");
    expect(getSaleSortValue(mockSale, "Unknown")).toBe("");
  });

  it("handles empty program gracefully", () => {
    const saleWithoutProgram = { ...mockSale, program: undefined };
    expect(getSaleSortValue(saleWithoutProgram, "Programa")).toBe("");
  });

  it("handles missing amountReceived gracefully when calculating Pendente", () => {
    const saleWithoutReceived = { ...mockSale, amountReceived: undefined };
    expect(getSaleSortValue(saleWithoutReceived, "Pendente")).toBe(1100);
  });
});
