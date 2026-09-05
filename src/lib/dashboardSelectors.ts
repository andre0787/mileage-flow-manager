import type { Account, Owner, PointEntry, Program, Sale } from "@/types";

/** Limite de CPFs por dono usado nos alertas do dashboard. */
export const MAX_CPF_PER_OWNER = 22;

export const accountsOfType = (accounts: Account[], type: "milhas" | "pontos") =>
  accounts.filter((a) => a.type === type);

export const salesOfAccountType = (sales: Sale[], accounts: Account[], type: "milhas" | "pontos") =>
  sales.filter((s) => accounts.find((a) => a.id === s.accountId)?.type === type);

export const entriesOfAccountType = (
  entries: PointEntry[],
  accounts: Account[],
  type: "milhas" | "pontos",
) =>
  entries.filter(
    (e) =>
      accounts.find((a) => a.id === e.accountId)?.type === type ||
      (e.sourceAccountId != null &&
        accounts.find((a) => a.id === e.sourceAccountId)?.type === type),
  );

const byOwner = <T>(
  items: T[],
  ownerId: string | null,
  ownerOf: (item: T) => string | undefined,
) => (!ownerId ? items : items.filter((item) => ownerOf(item) === ownerId));

export const accountsByOwner = (accounts: Account[], ownerId: string | null) =>
  byOwner(accounts, ownerId, (a) => a.ownerId);

export const salesByOwner = (sales: Sale[], accounts: Account[], ownerId: string | null) =>
  byOwner(sales, ownerId, (s) => accounts.find((a) => a.id === s.accountId)?.ownerId);

export const entriesByOwner = (
  entries: PointEntry[],
  accounts: Account[],
  ownerId: string | null,
) => {
  if (!ownerId) return entries;
  const ownerAccountIds = new Set(accounts.filter((a) => a.ownerId === ownerId).map((a) => a.id));
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
): OwnerDataRow[] =>
  owners
    .map((owner) => {
      const ownerAccounts = accounts.filter((a) => a.ownerId === owner.id);
      const ownerAccountIds = ownerAccounts.map((a) => a.id);
      const totalMiles = ownerAccounts.reduce((sum, a) => sum + a.balance, 0);
      const totalInvested = ownerAccounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
      const programIds = [...new Set(ownerAccounts.map((a) => a.programId))];
      const programsNames = programIds.map((id) => programs.find((p) => p.id === id)?.name ?? id);
      const ownerSales = sales.filter(
        (s) => s.status !== "cancelado" && ownerAccountIds.includes(s.accountId ?? ""),
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

export const computeProgramData = (
  accounts: Account[],
  programs: Program[],
): { name: string; value: number; color: string }[] => {
  const programMap = new Map<string, number>();
  accounts.forEach((a) => {
    const progName = programs.find((p) => p.id === a.programId)?.name ?? "Desconhecido";
    programMap.set(progName, (programMap.get(progName) ?? 0) + a.balance);
  });
  return Array.from(programMap.entries()).map(([name, value]) => ({
    name,
    value,
    color: "hsl(211 100% 45%)",
  }));
};
