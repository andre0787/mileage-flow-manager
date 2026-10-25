import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { formatDateBR } from "@/lib/dateUtils";

export interface SearchResult {
  type: "entrada" | "venda" | "cliente" | "conta";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const { entries, sales, clients, accounts, programs, origemTypes } = useData();

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const origemTypeById = useMemo(
    () => new Map(origemTypes.map((ot) => [ot.id, ot])),
    [origemTypes],
  );
  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    entries.forEach((e) => {
      const account = accountById.get(e.accountId);
      const origem =
        origemTypeById.get(e.origemTypeId)?.name ?? programById.get(e.origemTypeId)?.name ?? "";
      const text = `${account?.name ?? ""} ${origem} ${formatDateBR(e.date)}`.toLowerCase();
      if (text.includes(q)) {
        items.push({
          type: "entrada",
          id: e.id,
          title: `${(e.milesGenerated ?? e.amount).toLocaleString("pt-BR")} milhas`,
          subtitle: `${account?.name ?? ""} • ${origem}`,
          url: "/entradas",
        });
      }
    });

    sales.forEach((s) => {
      const text =
        `${s.clientName} ${s.ownerName} ${s.program} ${s.ticketLocator ?? ""}`.toLowerCase();
      if (text.includes(q)) {
        items.push({
          type: "venda",
          id: s.id,
          title: `${s.clientName} — ${s.milesUsed.toLocaleString("pt-BR")} milhas`,
          subtitle: `${s.ownerName} • ${s.program}`,
          url: "/vendas",
        });
      }
    });

    clients.forEach((c) => {
      const text = `${c.name} ${c.cpf ?? ""} ${c.email ?? ""} ${c.phone}`.toLowerCase();
      if (text.includes(q)) {
        items.push({
          type: "cliente",
          id: c.id,
          title: c.name,
          subtitle: c.cpf ?? c.phone ?? "",
          url: "/clientes",
        });
      }
    });

    accounts.forEach((a) => {
      const text = `${a.name} ${a.type}`.toLowerCase();
      if (text.includes(q)) {
        items.push({
          type: "conta",
          id: a.id,
          title: a.name,
          subtitle: `${a.type === "milhas" ? "Milhas" : "Pontos"} • ${a.balance.toLocaleString("pt-BR")}`,
          url: "/contas",
        });
      }
    });

    return items.slice(0, 20);
  }, [query, entries, sales, clients, accounts, accountById, origemTypeById, programById]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => {
      const arr = map.get(r.type) ?? [];
      arr.push(r);
      map.set(r.type, arr);
    });
    return map;
  }, [results]);

  const flatResults = useMemo(
    () => Array.from(grouped.entries()).flatMap(([, items]) => items),
    [grouped],
  );

  return {
    query,
    setQuery,
    results,
    grouped,
    flatResults,
  };
}
