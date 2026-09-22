import { describe, it, expect } from "vitest";
import { computeOwnerData } from "@/lib/dashboardSelectors";
import type { Account, Owner, Program, Sale } from "@/types";

describe("computeOwnerData Benchmark", () => {
  it("measures performance of computeOwnerData with linear vs map lookup dataset", () => {
    const numOwners = 200;
    const numPrograms = 50;
    const numAccountsPerOwner = 10;
    const numSalesPerAccount = 5;

    const owners: Owner[] = Array.from({ length: numOwners }, (_, i) => ({
      id: `owner-${i}`,
      name: `Owner ${i}`,
      cpf: `111222333${i}`,
      phone: "123456789",
    }));

    const programs: Program[] = Array.from({ length: numPrograms }, (_, i) => ({
      id: `prog-${i}`,
      name: `Program Name ${i}`,
      type: "milhas",
      maxPassengers: 25,
    }));

    const accounts: Account[] = [];
    const sales: Sale[] = [];

    for (const owner of owners) {
      for (let a = 0; a < numAccountsPerOwner; a++) {
        const accId = `acc-${owner.id}-${a}`;
        const progId = `prog-${a % numPrograms}`;
        accounts.push({
          id: accId,
          name: `Account ${accId}`,
          ownerId: owner.id,
          programId: progId,
          type: "milhas",
          balance: 10000 + a,
          totalInvested: 500 + a,
          status: "ativa",
          createdAt: "2026-01-01",
        });

        for (let s = 0; s < numSalesPerAccount; s++) {
          sales.push({
            id: `sale-${accId}-${s}`,
            accountId: accId,
            accountName: `Account ${accId}`,
            ownerName: owner.name,
            program: `Program Name ${a % numPrograms}`,
            clientId: "client-1",
            clientName: "Client 1",
            milesUsed: 1000,
            saleValue: 100,
            costPerMile: 0.05,
            profit: 50,
            profitMargin: 0.5,
            status: "concluido",
            ticketLocator: "ABCDEF",
            passengers: [
              { name: `Pass ${s}`, passengerId: `p-${s}`, cpf: `123456789${s % 10}` },
            ],
            date: "2026-08-01",
          });
        }
      }
    }

    const iterations = 20;

    const start = performance.now();
    let resultRows = 0;
    for (let iter = 0; iter < iterations; iter++) {
      const rows = computeOwnerData(owners, accounts, programs, sales);
      resultRows = rows.length;
    }
    const duration = performance.now() - start;

    expect(resultRows).toBe(numOwners);
    // Print timing info for reference
    expect(duration).toBeGreaterThan(0);
  });
});
