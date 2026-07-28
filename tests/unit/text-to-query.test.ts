import { describe, it, expect } from "vitest";
import {
  parseNaturalQuery,
  describeFilters,
  filtersToSupabaseParams,
} from "@/lib/text-to-query";

describe("text-to-query", () => {
  describe("parseNaturalQuery", () => {
    it("retorna null para query vazia", () => {
      expect(parseNaturalQuery("")).toBeNull();
      expect(parseNaturalQuery("   ")).toBeNull();
    });

    it("interpreta 'vendas por cliente'", () => {
      const result = parseNaturalQuery("vendas por cliente");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
      expect(result!.groupBy).toBe("client");
    });

    it("interpreta 'vendas do mês passado'", () => {
      const result = parseNaturalQuery("vendas do mês passado");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
      expect(result!.period).toBe("last_month");
    });

    it("interpreta 'entradas do mês'", () => {
      const result = parseNaturalQuery("entradas do mês");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("entries");
      expect(result!.period).toBe("this_month");
    });

    it("interpreta 'saldo total'", () => {
      const result = parseNaturalQuery("saldo total");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("accounts");
      expect(result!.isAggregate).toBe(true);
    });

    it("interpreta 'lucro do mês'", () => {
      const result = parseNaturalQuery("lucro do mês");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
      expect(result!.metric).toBe("profit");
    });

    it("interpreta 'vendas pendentes'", () => {
      const result = parseNaturalQuery("vendas pendentes");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("pendente");
    });

    it("detecta programa na query", () => {
      const result = parseNaturalQuery("vendas azul este mês");
      expect(result).not.toBeNull();
      expect(result!.program).toMatch(/azul/i);
    });

    it("infere tabela por contexto", () => {
      const result = parseNaturalQuery("quanto lucro tivemos");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
    });
  });

  describe("describeFilters", () => {
    it("usa label se disponível", () => {
      const filters = parseNaturalQuery("vendas por cliente")!;
      expect(describeFilters(filters)).toBe("Vendas por cliente");
    });

    it("gera descrição para filtros personalizados", () => {
      const filters = parseNaturalQuery("entradas do mês")!;
      const desc = describeFilters(filters);
      expect(desc.toLowerCase()).toContain("entradas");
      expect(desc).toContain("mês");
    });
  });

  describe("filtersToSupabaseParams", () => {
    it("mapeia tabela entries para point_entries", () => {
      const filters = parseNaturalQuery("entradas do mês")!;
      const params = filtersToSupabaseParams(filters);
      expect(params.table).toBe("point_entries");
    });

    it("usa select count para agregação", () => {
      const filters = parseNaturalQuery("saldo total")!;
      const params = filtersToSupabaseParams(filters);
      expect(params.select).toBe("count");
    });

    it("inclui eq para status", () => {
      const filters = parseNaturalQuery("vendas pendentes")!;
      const params = filtersToSupabaseParams(filters);
      expect(params.eq).toEqual({ status: "pendente" });
    });
  });
});
