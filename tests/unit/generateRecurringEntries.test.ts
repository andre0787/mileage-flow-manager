import { describe, expect, it } from "vitest";
import { generateRecurringEntries } from "@/hooks/useDatabase/shared";
import type { PointEntry } from "@/types";

const entry = (date: string) =>
  ({
    id: "entry-1",
    accountId: "account-1",
    origemTypeId: "origin-1",
    amount: 100,
    amountPaid: 50,
    costPerThousand: 500,
    date,
  }) as PointEntry;

describe("generateRecurringEntries", () => {
  it("mantém o dia configurado sem drift ao atravessar meses curtos", () => {
    const recurring = generateRecurringEntries(
      entry("2025-01-31"),
      "user-1",
      30,
      "2025-04-30",
      31,
    );

    expect(recurring.map((item) => item.date)).toEqual([
      "2025-02-28",
      "2025-03-31",
      "2025-04-30",
    ]);
  });

  it("usa 29 de fevereiro em ano bissexto e volta ao dia 31 em março", () => {
    const recurring = generateRecurringEntries(
      entry("2024-01-31"),
      "user-1",
      30,
      "2024-03-31",
      31,
    );

    expect(recurring.map((item) => item.date)).toEqual(["2024-02-29", "2024-03-31"]);
  });
});
