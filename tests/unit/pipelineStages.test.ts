import { describe, it, expect } from "vitest";
import {
  entryStage,
  saleStage,
  saleDueDate,
  isExpedite,
  buildPipelineWip,
} from "@/lib/pipelineStages";

describe("entryStage", () => {
  it("aguardando quando amount_paid < amount", () => {
    expect(entryStage({ amountPaid: 50, amount: 100 })).toBe("aguardando");
  });
  it("comprado quando amount_paid >= amount", () => {
    expect(buildPipelineWip([{ amountPaid: 100, amount: 100 }], []).comprado).toBe(1);
    expect(entryStage({ amountPaid: 120, amount: 100 })).toBe("comprado");
  });
});

describe("saleStage", () => {
  it("mapeia pendente/pago/concluido e resto vira cancelado", () => {
    expect(saleStage({ status: "pendente" })).toBe("a_executar");
    expect(saleStage({ status: "pago" })).toBe("a_receber");
    expect(saleStage({ status: "concluido" })).toBe("recebido");
    expect(saleStage({ status: "cancelado" })).toBe("cancelado");
  });
});

describe("saleDueDate / isExpedite", () => {
  it("vencimento = sale.date + 30d", () => {
    const d = saleDueDate({ date: "2026-09-01" });
    expect(d.toISOString().slice(0, 10)).toBe("2026-10-01");
  });
  it("expedite só para A Receber com vencimento em ≤ 7d", () => {
    const today = new Date("2026-09-06T12:00:00");
    expect(isExpedite({ status: "pago", date: "2026-08-10" }, today)).toBe(true);
    expect(isExpedite({ status: "pago", date: "2026-09-05" }, today)).toBe(false);
    expect(isExpedite({ status: "pendente", date: "2026-08-01" }, today)).toBe(false);
    expect(isExpedite({ status: "concluido", date: "2026-08-01" }, today)).toBe(false);
  });
});

describe("buildPipelineWip", () => {
  it("conta estágios e exclui servico do WIP de milhas", () => {
    const wip = buildPipelineWip(
      [
        { amountPaid: 0, amount: 100 },
        { amountPaid: 100, amount: 100 },
      ],
      [
        { status: "pendente", date: "2026-09-01" },
        { status: "pago", date: "2026-09-01" },
        { status: "concluido", date: "2026-09-01" },
        { status: "cancelado", date: "2026-09-01" },
        { status: "pago", date: "2026-09-01", kind: "servico" },
      ],
      new Date("2026-09-06T12:00:00"),
    );
    expect(wip).toMatchObject({
      aguardando: 1,
      comprado: 1,
      aExecutar: 1,
      aReceber: 1,
      recebido: 1,
      cancelado: 1,
      servicoFora: 1,
    });
  });
});
