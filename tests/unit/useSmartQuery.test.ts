import { describe, it, expect } from "vitest";
import { parseNaturalQuery, describeFilters } from "@/lib/text-to-query";
import { periodFromFilter } from "@/hooks/useSmartQuery";

describe("useSmartQuery — pure logic", () => {
  describe("parseNaturalQuery", () => {
    it("retorna null para query vazia", () => {
      expect(parseNaturalQuery("")).toBeNull();
      expect(parseNaturalQuery("   ")).toBeNull();
    });

    it("interpreta 'vendas do mês passado'", () => {
      const result = parseNaturalQuery("vendas do mês passado");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
      expect(result!.period).toBe("last_month");
      expect(result!.metric).toBe("profit");
    });

    it("interpreta 'entradas por programa'", () => {
      const result = parseNaturalQuery("entradas por programa");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("entries");
      expect(result!.groupBy).toBe("program");
    });

    it("interpreta 'lucro total'", () => {
      const result = parseNaturalQuery("lucro total");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
      expect(result!.period).toBe("all");
      expect(result!.isAggregate).toBe(true);
    });

    it("interpreta 'clientes ativos'", () => {
      const result = parseNaturalQuery("clientes ativos");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("clients");
      expect(result!.status).toBe("confirmada");
    });

    it("interpreta 'vendas pendentes'", () => {
      const result = parseNaturalQuery("vendas pendentes");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
      expect(result!.status).toBe("pendente");
    });

    it("interpreta 'saldo por programa'", () => {
      const result = parseNaturalQuery("saldo por programa");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("accounts");
      expect(result!.groupBy).toBe("program");
      expect(result!.metric).toBe("balance");
    });

    it("interpreta 'rentabilidade geral'", () => {
      const result = parseNaturalQuery("rentabilidade geral");
      expect(result).not.toBeNull();
      expect(result!.metric).toBe("cost");
      expect(result!.isAggregate).toBe(true);
    });

    it("reconhece programa na query", () => {
      const result = parseNaturalQuery("vendas azul este mês");
      expect(result).not.toBeNull();
      expect(result!.program).toMatch(/azul/i);
    });

    it("fallback para sales se tabela não identificada", () => {
      const result = parseNaturalQuery("alguma coisa qualquer");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
    });
  });

  describe("describeFilters", () => {
    it("retorna label para queries conhecidas", () => {
      const filters = parseNaturalQuery("vendas do mês passado")!;
      expect(describeFilters(filters)).toBe("Vendas do mês passado");
    });

    it("retorna label para entradas por programa", () => {
      const filters = parseNaturalQuery("entradas por programa")!;
      expect(describeFilters(filters)).toBe("Entradas por programa");
    });

    it("retorna label para lucro total", () => {
      const filters = parseNaturalQuery("lucro total")!;
      expect(describeFilters(filters)).toBe("Lucro total");
    });
  });

  describe("periodFromFilter", () => {
    it("mapeia this_month para 30", () => {
      expect(periodFromFilter("this_month")).toBe("30");
    });
    it("mapeia last_month para 60", () => {
      expect(periodFromFilter("last_month")).toBe("60");
    });
    it("mapeia this_year para 365", () => {
      expect(periodFromFilter("this_year")).toBe("365");
    });
    it("retorna undefined para valor desconhecido", () => {
      expect(periodFromFilter("unknown")).toBeUndefined();
    });
    it("retorna undefined para undefined", () => {
      expect(periodFromFilter(undefined)).toBeUndefined();
    });
  });
});
