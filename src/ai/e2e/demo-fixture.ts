/**
 * demo-fixture.ts — Fixture determinística do demo tenant (P12.5-01/03).
 *
 * Extraído de demo-tenant.ts (rule-41). Define os tipos de dados e o estado
 * inicial determinístico usado como snapshot baseline.
 */

export interface DemoAccount {
  id: string;
  owner: string;
  program: string;
  balance: number;
  totalMiles: number;
}

export interface DemoMileageEntry {
  id: string;
  accountId: string;
  date: string;
  miles: number;
  description: string;
  origem: string;
}

export interface DemoSettings {
  language: string;
  theme: "light" | "dark";
}

/** Dataset controlado do demo (fixture inicial determinística). */
export interface DemoDataset {
  accounts: DemoAccount[];
  entries: DemoMileageEntry[];
  settings: DemoSettings;
  scenarioIds: string[];
}

/** Prefixo reservado: garante isolamento (T4 IDOR). */
export const DEMO_ID_PREFIX = "demo_";

export function isDemoId(id: string): boolean {
  return id.startsWith(DEMO_ID_PREFIX);
}

/** Fixture inicial determinística (P12.5-03 snapshot baseline). */
export function createDemoFixture(): DemoDataset {
  const accountA = `${DEMO_ID_PREFIX}acct_a`;
  const accountB = `${DEMO_ID_PREFIX}acct_b`;
  return {
    accounts: [
      { id: accountA, owner: "Demo", program: "Smiles", balance: 12_500, totalMiles: 25_000 },
      { id: accountB, owner: "Demo", program: "Latam Pass", balance: 8_200, totalMiles: 16_400 },
    ],
    entries: [
      {
        id: `${DEMO_ID_PREFIX}entry_1`,
        accountId: accountA,
        date: "2026-08-01",
        miles: 1_500,
        description: "Demo compra",
        origem: "Compra",
      },
      {
        id: `${DEMO_ID_PREFIX}entry_2`,
        accountId: accountA,
        date: "2026-08-02",
        miles: 800,
        description: "Demo vôo",
        origem: "Vôo",
      },
      {
        id: `${DEMO_ID_PREFIX}entry_3`,
        accountId: accountB,
        date: "2026-08-03",
        miles: 2_000,
        description: "Demo transferência",
        origem: "Transferência",
      },
    ],
    settings: { language: "pt-BR", theme: "light" },
    scenarioIds: ["create-mileage-entry", "dashboard-totals", "demo-reset"],
  };
}
