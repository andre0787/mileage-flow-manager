import { describe, it, expect } from "vitest";
import { mapSale } from "@/hooks/useDatabase/mappers";

const baseRow = {
  id: "sale-1",
  account_id: "acc-1",
  account_name: "Conta Milhas",
  owner_name: "Dono",
  program: "Programa X",
  client_id: "client-1",
  client_name: "Cliente Azul",
  miles_used: 10000,
  sale_value: 2000,
  price_per_mile: 0.2,
  cost_per_mile: 0.05,
  additional_cost: 100,
  additional_cost_desc: "Taxa",
  profit: 1450,
  profit_margin: 0.725,
  status: "pendente",
  ticket_locator: "AB12CD",
  passengers: [],
  date: "2026-08-10",
};

describe("mapSale — kind/serviceType/observations", () => {
  it("default kind=milhas quando sale_kind é NULL (linhas antigas)", () => {
    const sale = mapSale({ ...baseRow } as never);
    expect(sale.kind).toBe("milhas");
    expect(sale.serviceType).toBeUndefined();
    expect(sale.observations).toBeUndefined();
  });

  it("mapeia venda-serviço com tipo e observações", () => {
    const sale = mapSale({
      ...baseRow,
      account_id: null,
      miles_used: 0,
      sale_kind: "servico",
      service_type: "consultoria",
      observations: "Sessão de 2h",
    } as never);
    expect(sale.kind).toBe("servico");
    expect(sale.serviceType).toBe("consultoria");
    expect(sale.observations).toBe("Sessão de 2h");
    expect(sale.accountId).toBeUndefined();
  });
});
