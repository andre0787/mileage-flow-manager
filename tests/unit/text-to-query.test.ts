import { describe, it, expect } from "vitest";
import { parseNaturalQuery, describeFilters, filtersToSupabaseParams } from "@/lib/text-to-query";

describe("text-to-query", () => {
  describe("parseNaturalQuery", () => {
    it("retorna null para query vazia ou apenas espaços", () => {
      expect(parseNaturalQuery("")).toBeNull();
      expect(parseNaturalQuery("   \t\n ")).toBeNull();
    });

    it("interpreta padrões de vendas, entradas, contas e clientes", () => {
      expect(parseNaturalQuery("vendas por cliente")).toMatchObject({ table: "sales", groupBy: "client", metric: "profit" });
      expect(parseNaturalQuery("vendas do mês passado")).toMatchObject({ table: "sales", period: "last_month" });
      expect(parseNaturalQuery("vendas por programa")).toMatchObject({ table: "sales", groupBy: "program" });
      expect(parseNaturalQuery("vendas pendentes")).toMatchObject({ table: "sales", status: "pendente", metric: "count" });
      expect(parseNaturalQuery("vendas concluídas")).toMatchObject({ table: "sales", status: "concluido", metric: "profit" });
      expect(parseNaturalQuery("entradas do mês passado")).toMatchObject({ table: "entries", period: "last_month", metric: "amount" });
      expect(parseNaturalQuery("compras do mês")).toMatchObject({ table: "entries", period: "this_month", metric: "amount" });
      expect(parseNaturalQuery("saldos por programa")).toMatchObject({ table: "accounts", groupBy: "program", metric: "balance" });
      expect(parseNaturalQuery("contas ativas")).toMatchObject({ table: "accounts", status: "confirmada", isAggregate: true });
      expect(parseNaturalQuery("contas inativas")).toMatchObject({ table: "accounts", status: "aguardando", isAggregate: true });
      expect(parseNaturalQuery("clientes ativos")).toMatchObject({ table: "clients", status: "confirmada", isAggregate: true });
      expect(parseNaturalQuery("rentabilidade")).toMatchObject({ table: "entries", period: "all", metric: "cost", isAggregate: true });
    });

    it("interpreta padrões de períodos gerais", () => {
      expect(parseNaturalQuery("hoje")).toMatchObject({ period: "today" });
      expect(parseNaturalQuery("esta semana")).toMatchObject({ period: "this_week" });
      expect(parseNaturalQuery("este ano")).toMatchObject({ period: "this_year", metric: "profit" });
      expect(parseNaturalQuery("ano passado")).toMatchObject({ period: "last_year", metric: "profit" });
      expect(parseNaturalQuery("todos os registros geral")).toMatchObject({ period: "all", isAggregate: true });
    });

    it("infere tabela por contexto quando nenhum padrão pré-definido combina", () => {
      expect(parseNaturalQuery("faturamento de ontem")!.table).toBe("sales");
      expect(parseNaturalQuery("receita extra")!.table).toBe("sales");
      expect(parseNaturalQuery("programa de pontos")!.table).toBe("accounts");
      expect(parseNaturalQuery("investimento alto")!.table).toBe("entries");
      expect(parseNaturalQuery("desconhecido aleatorio")!.table).toBe("sales"); // fallback
    });

    it("extrai programa de milhas da query", () => {
      expect(parseNaturalQuery("relatório smiles")!.program?.toLowerCase()).toBe("smiles");
      expect(parseNaturalQuery("compras latam")!.program?.toLowerCase()).toBe("latam");
      expect(parseNaturalQuery("vendas tudoazul")!.program?.toLowerCase()).toBe("tudoazul");
      expect(parseNaturalQuery("saldo esfera")!.program?.toLowerCase()).toBe("esfera");
      expect(parseNaturalQuery("pontos livelo")!.program?.toLowerCase()).toBe("livelo");
    });

    it("processa tokens sem key-value sem quebrar nem corromper filtros", () => {
      const result = parseNaturalQuery("vendas com texto simples 123 !@#");
      expect(result).not.toBeNull();
      expect(result!.table).toBe("sales");
      expect(result!.status).toBeUndefined();
    });

    it("suporta tokens estruturados no formato key:value", () => {
      const result = parseNaturalQuery(
        "status:pendente program:smiles table:entries period:last_month groupBy:client metric:profit",
      );
      expect(result).not.toBeNull();
      expect(result!.status).toBe("pendente");
      expect(result!.program).toBe("smiles");
      expect(result!.table).toBe("entries");
      expect(result!.period).toBe("last_month");
      expect(result!.groupBy).toBe("client");
      expect(result!.metric).toBe("profit");
    });

    it("trata tokens com dois pontos malformados ou incompletos", () => {
      const result1 = parseNaturalQuery("vendas : status: :pendente ::: status:pendente");
      expect(result1).not.toBeNull();
      expect(result1!.status).toBe("pendente");

      const result2 = parseNaturalQuery("tabela:invalid key:val");
      expect(result2).not.toBeNull();
      expect(result2!.table).toBe("sales");
    });

    it("trata tokens entre aspas e com múltiplos espaços", () => {
      const result = parseNaturalQuery("   \"status:pendente\"    'program:azul'   ");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("pendente");
      expect(result!.program).toBe("azul");
    });
  });

  describe("describeFilters", () => {
    it("usa label de padrão se disponível ou formata para filtros dinâmicos", () => {
      const filters = parseNaturalQuery("vendas por cliente")!;
      expect(describeFilters(filters)).toBe("Vendas por cliente");

      const customFilters = {
        table: "sales" as const,
        period: "this_month" as const,
        groupBy: "client" as const,
        status: "pendente" as const,
        program: "smiles",
        isAggregate: false,
        label: "Consulta personalizada",
      };
      const desc = describeFilters(customFilters);
      expect(desc).toBe("Relatório de vendas | este mês | agrupado por client | status: pendente | smiles");
    });
  });

  describe("filtersToSupabaseParams", () => {
    it("mapeia tabelas, agregações e filtros eq para Supabase", () => {
      const filtersEntries = parseNaturalQuery("entradas do mês")!;
      expect(filtersToSupabaseParams(filtersEntries)).toEqual({
        table: "point_entries",
        select: "*",
        eq: undefined,
      });

      const filtersAggregate = parseNaturalQuery("saldo total")!;
      expect(filtersToSupabaseParams(filtersAggregate)).toEqual({
        table: "accounts",
        select: "count",
        eq: undefined,
      });

      const filtersStatus = parseNaturalQuery("vendas pendentes")!;
      expect(filtersToSupabaseParams(filtersStatus)).toEqual({
        table: "sales",
        select: "*",
        eq: { status: "pendente" },
      });
    });
  });
});
