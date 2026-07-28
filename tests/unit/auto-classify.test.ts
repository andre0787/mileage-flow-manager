import { describe, it, expect } from "vitest";
import {
  classifyByText,
  classifyEntry,
  detectProgram,
  categoryLabel,
  categoryColor,
} from "@/lib/auto-classify";

describe("auto-classify", () => {
  describe("classifyByText", () => {
    it("classifica compra por keyword", () => {
      const result = classifyByText("Compra de milhas Azul");
      expect(result.category).toBe("compra");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("classifica transferência por keyword", () => {
      const result = classifyByText("Transferência de pontos Livelo");
      expect(result.category).toBe("transferencia");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("classifica bônus por keyword", () => {
      const result = classifyByText("Bônus promocional Smiles");
      expect(result.category).toBe("bonus");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("classifica viagem por keyword", () => {
      const result = classifyByText("Passagem aérea SP-RJ");
      expect(result.category).toBe("viagem");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("retorna desconhecido para texto sem match", () => {
      const result = classifyByText("xyzzy zork");
      expect(result.category).toBe("desconhecido");
      expect(result.confidence).toBe(0);
    });

    it("é case-insensitive e ignora acentos", () => {
      const result = classifyByText("TRANSFERÊNCIA DE PONTOS");
      expect(result.category).toBe("transferencia");
    });
  });

  describe("detectProgram", () => {
    it("detecta Azul Fidelidade", () => {
      expect(detectProgram("Compra Azul")).toBe("Azul Fidelidade");
    });

    it("detecta LATAM Pass", () => {
      expect(detectProgram("Resgate LATAM")).toBe("LATAM Pass");
    });

    it("detecta Smiles via GOL", () => {
      expect(detectProgram("GOL Smiles")).toBe("Smiles");
    });

    it("detecta Livelo", () => {
      expect(detectProgram("Compra Livelo")).toBe("Livelo");
    });

    it("retorna undefined para programa desconhecido", () => {
      expect(detectProgram("Programa inventado")).toBeUndefined();
    });
  });

  describe("classifyEntry", () => {
    it("classifica entrada completa", () => {
      const result = classifyEntry("Azul", "Compra de milhas", 10000);
      expect(result.category).toBe("compra");
      expect(result.program).toBe("Azul Fidelidade");
      expect(result.tags.length).toBeGreaterThan(0);
    });

    it("sugere transferência para volume alto sem classificação", () => {
      const result = classifyEntry("ProgramaX", "movimentação mensal", 60000);
      expect(result.category).toBe("transferencia");
    });

    it("retorna ícone correspondente", () => {
      const result = classifyEntry("Smiles", "Bônus promocional");
      expect(result.icon).toBeDefined();
    });
  });

  describe("categoryLabel", () => {
    it("retorna label em pt-BR", () => {
      expect(categoryLabel("compra")).toBe("Compra");
      expect(categoryLabel("transferencia")).toBe("Transferência");
      expect(categoryLabel("bonus")).toBe("Bônus");
      expect(categoryLabel("viagem")).toBe("Viagem");
      expect(categoryLabel("desconhecido")).toBe("Outro");
    });
  });

  describe("categoryColor", () => {
    it("retorna cor hex", () => {
      expect(categoryColor("compra")).toMatch(/^#[0-9a-f]{6}$/);
      expect(categoryColor("desconhecido")).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});
