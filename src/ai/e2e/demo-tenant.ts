/**
 * demo-tenant.ts — Demo Tenant Foundation (P12.5-01).
 *
 * Tenant lógico `__demo__` com dataset controlado (fixtures). NUNCA mistura
 * com usuários reais: o demo só toca estas fixtures, e os IDs usam prefixo
 * reservado (`demo_`) para impedir colisão/IDOR com dados reais.
 *
 * Tipos/fixture em demo-fixture.ts (rule-41 — hard limit de 150 linhas).
 */

import type { PermissionSet } from "./context";
import {
  DEMO_ID_PREFIX,
  isDemoId,
  createDemoFixture,
  type DemoAccount,
  type DemoDataset,
  type DemoMileageEntry,
} from "./demo-fixture";

export const DEMO_TENANT_ID = "__demo__";

/** Políticas do demo por operação (P12.5-01). */
export interface DemoPolicies {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  reset: boolean;
  export: boolean;
  admin: boolean;
}

export const DEMO_POLICIES: DemoPolicies = {
  read: true,
  create: true,
  update: true,
  delete: true,
  reset: true,
  export: false,
  admin: false,
};

/** Valida que um PermissionSet não excede as políticas do demo. */
export function validateDemoPermissions(permissions: PermissionSet): boolean {
  return (
    permissions.read === DEMO_POLICIES.read &&
    permissions.create === DEMO_POLICIES.create &&
    permissions.update === DEMO_POLICIES.update &&
    permissions.delete === DEMO_POLICIES.delete &&
    permissions.reset === DEMO_POLICIES.reset &&
    permissions.export === DEMO_POLICIES.export &&
    permissions.admin === DEMO_POLICIES.admin
  );
}

export { DEMO_ID_PREFIX, isDemoId, createDemoFixture };
export type { DemoAccount, DemoDataset, DemoMileageEntry, DemoSettings } from "./demo-fixture";

/**
 * Demonstração das funcionalidades produtivas permitidas dentro das fronteiras
 * (tenant/system/security boundary). Retorna sempre dentro do tenant demo.
 */
export function listDemoAccounts(dataset: DemoDataset): DemoAccount[] {
  return dataset.accounts.filter((a) => isDemoId(a.id));
}

/** Cria entrada no demo (valida tenant + tamanho do payload). */
export function addDemoEntry(
  dataset: DemoDataset,
  entry: Omit<DemoMileageEntry, "id">,
  maxPayload = 1_000_000,
): DemoDataset {
  const payload = JSON.stringify(entry);
  if (payload.length > maxPayload) {
    throw new Error(`demo payload exceeds limit (${payload.length} > ${maxPayload})`);
  }
  const account = dataset.accounts.find((a) => a.id === entry.accountId);
  if (!account || !isDemoId(account.id)) {
    throw new Error(`demo account not found or outside demo tenant: ${entry.accountId}`);
  }
  const id = `${DEMO_ID_PREFIX}entry_${dataset.entries.length + 1}`;
  return {
    ...dataset,
    accounts: dataset.accounts.map((a) =>
      a.id === account.id
        ? { ...a, balance: a.balance + entry.miles, totalMiles: a.totalMiles + entry.miles }
        : a,
    ),
    entries: [...dataset.entries, { ...entry, id }],
  };
}
