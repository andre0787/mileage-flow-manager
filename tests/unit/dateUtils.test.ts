import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { formatDateBR } from "@/lib/dateUtils";

const ORIGINAL_TZ = process.env.TZ;

// Fixa TZ negativa para reproduzir o bug de fuso (independe do TZ do runner/CI)
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe("formatDateBR", () => {
  it("formata data ISO date-only em pt-BR sem deslocar o dia (fuso -3)", () => {
    expect(formatDateBR("2026-08-05")).toBe("05/08/2026");
  });

  it("formata datas no início do mês e do ano corretamente", () => {
    expect(formatDateBR("2026-01-01")).toBe("01/01/2026");
    expect(formatDateBR("2026-12-31")).toBe("31/12/2026");
  });

  it("não desloca dia mesmo com TZ negativa (bug histórico: new Date(date) UTC → dia anterior)", () => {
    // Sem a correção, em America/Sao_Paulo: new Date("2026-08-05") → 04/08/2026
    expect(formatDateBR("2026-03-01")).toBe("01/03/2026");
    expect(formatDateBR("2026-07-15")).toBe("15/07/2026");
  });
});
