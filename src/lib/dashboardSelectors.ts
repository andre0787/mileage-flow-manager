import type { Account, Owner, PointEntry, Program, Sale } from "@/types";

/** Limite de CPFs por dono usado nos alertas do dashboard. */
export const MAX_CPF_PER_OWNER = 22;

export const accountsOfType = (accounts: Account[], type: "milhas" | "pontos") =>
  accounts.filter((a) => a.type === type);

export const salesOfAccountType = (sales: Sale[], accounts: Account[], type: "milhas" | "pontos") => {
  const accountIds = new Set(accounts.filter((a) => a.type === type).map((a) => a.id));
  return sales.filter((s) => s.accountId != null && accountIds.has(s.accountId));
};

export const entriesOfAccountType = (
  entries: PointEntry[],
  accounts: Account[],
  type: "milhas" | "pontos",
) => {
  const accountIds = new Set(accounts.filter((a) => a.type === type).map((a) => a.id));
  return entries.filter(
    (e) =>
      accountIds.has(e.accountId) ||
      (e.sourceAccountId != null && accountIds.has(e.sourceAccountId)),
  );
};

export const accountsByOwner = (accounts: Account[], ownerId: string | null) =>
  !ownerId ? accounts : accounts.filter((a) => a.ownerId === ownerId);

export const getOwnerAccountIds = (accounts: Account[], ownerId: string): Set<string> =>
  accounts.reduce((acc, a) => {
    if (a.ownerId === ownerId) acc.add(a.id);
    return acc;
  }, new Set<string>());

export const salesByOwner = (sales: Sale[], accounts: Account[], ownerId: string | null) => {
  if (!ownerId) return sales;
  const ownerAccountIds = getOwnerAccountIds(accounts, ownerId);
  return sales.filter((s) => s.accountId != null && ownerAccountIds.has(s.accountId));
};

export const entriesByOwner = (
  entries: PointEntry[],
  accounts: Account[],
  ownerId: string | null,
) => {
  if (!ownerId) return entries;
  const ownerAccountIds = getOwnerAccountIds(accounts, ownerId);
  return entries.filter(
    (e) =>
      ownerAccountIds.has(e.accountId) ||
      (e.sourceAccountId != null && ownerAccountIds.has(e.sourceAccountId)),
  );
};

export interface OwnerDataRow {
  owner: string;
  programs: string[];
  totalMiles: number;
  totalInvested: number;
  avgCost: number;
  cpfCount: number;
  maxCpf: number;
}

export const computeOwnerData = (
  owners: Owner[],
  accounts: Account[],
  programs: Program[],
  sales: Sale[],
  maxCpf: number = MAX_CPF_PER_OWNER,
): OwnerDataRow[] => {
  const programMap = new Map<string, string>(programs.map((p) => [p.id, p.name]));
  return owners
    .map((owner) => {
      const ownerAccounts = accounts.filter((a) => a.ownerId === owner.id);
      const ownerAccountIds = new Set(ownerAccounts.map((a) => a.id));
      const totalMiles = ownerAccounts.reduce((sum, a) => sum + a.balance, 0);
      const totalInvested = ownerAccounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
      const programIds = [...new Set(ownerAccounts.map((a) => a.programId))];
      const programsNames = programIds.map((id) => programMap.get(id) ?? id);
      const ownerSales = sales.filter(
        (s) => s.status !== "cancelado" && ownerAccountIds.has(s.accountId ?? ""),
      );
      const usedCpfs = new Set(ownerSales.flatMap((s) => s.passengers.map((p) => p.cpf)));
      const avgCost = totalMiles > 0 ? totalInvested / totalMiles : 0;
      return {
        owner: owner.name,
        programs: programsNames,
        totalMiles,
        totalInvested,
        avgCost,
        cpfCount: usedCpfs.size,
        maxCpf,
      };
    })
    .filter((o) => o.totalMiles > 0 || o.totalInvested > 0);
};

export const computeProgramData = (
  accounts: Account[],
  programs: Program[],
): { name: string; value: number; color: string }[] => {
  const programMap = new Map<string, number>();
  const progNames = new Map<string, string>(programs.map((p) => [p.id, p.name]));
  accounts.forEach((a) => {
    const progName = progNames.get(a.programId) ?? "Desconhecido";
    programMap.set(progName, (programMap.get(progName) ?? 0) + a.balance);
  });
  return Array.from(programMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: "hsl(211 100% 45%)",
  }));
};
