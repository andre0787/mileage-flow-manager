/**
 * Teste de integração: auto-classify no EntryForm
 *
 * Verifica que a classificação automática de categoria funciona
 * corretamente com entradas de milhas no formulário.
 */

import { describe, it, expect } from "vitest";
import { classifyByText, categoryLabel, categoryColor } from "@/lib/auto-classify";

interface OrigemType {
  name: string;
  description?: string;
  amount: number;
}

describe("EntryForm → auto-classify integração", () => {
  // Simula a lógica em EntryForm.tsx (linhas 654-670)
  function simulateClassification(ot: OrigemType) {
    const classification = classifyByText(ot.name + " " + (ot.description || ""));
    return {
      label: categoryLabel(classification.category),
      color: categoryColor(classification.category),
      confidence: classification.confidence,
    };
  }

  it("classifica 'Compra de milhas Azul' como compra", () => {
    const result = simulateClassification({ name: "Compra de milhas", description: "Azul Fidelidade", amount: 10000 });
    expect(result.label).toBe("Compra");
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("classifica 'Assinatura Clube Smiles' como compra", () => {
    const result = simulateClassification({ name: "Assinatura", description: "Clube Smiles", amount: 1000 });
    expect(result.label).toBe("Compra");
  });

  it("classifica 'Transferência de pontos Livelo' como transferência", () => {
    const result = simulateClassification({ name: "Transferência", description: "Livelo para Latam", amount: 50000 });
    expect(result.label).toBe("Transferência");
  });

  it("classifica 'Bônus Promocional' como bônus", () => {
    const result = simulateClassification({ name: "Bônus Promocional", description: "", amount: 5000 });
    expect(result.label).toBe("Bônus");
  });

  it("classifica 'Passagem Aérea' como viagem", () => {
    const result = simulateClassification({ name: "Passagem Aérea", description: "Reserva Rio-SP", amount: 20000 });
    expect(result.label).toBe("Viagem");
  });

  it("classifica volume alto sem match como Outro (fallback)", () => {
    const result = simulateClassification({ name: "Movimentação diversa", description: "Valor mensal", amount: 80000 });
    expect(result.label).toBe("Outro");
  });

  it("classifica volume baixo sem match como Outro", () => {
    const result = simulateClassification({ name: "Ajuste manual", description: "", amount: 500 });
    expect(result.label).toBe("Outro");
  });

  it("classifica corretamente por nome 'Clube Azul'", () => {
    const result = simulateClassification({ name: "Clube Azul", description: "", amount: 3000 });
    expect(result.label).toBe("Compra");
  });

  it("classifica 'Bônus Assinatura' como bônus (keyword composta)", () => {
    const result = simulateClassification({ name: "Bônus Assinatura", description: "Programa fidelidade", amount: 2000 });
    expect(result.label).toBe("Bônus");
  });
});
