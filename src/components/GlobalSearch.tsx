import { useState, useRef, useEffect, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, Users, CreditCard, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "entrada" | "venda" | "cliente" | "conta";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

const typeIcons = {
  entrada: TrendingUp,
  venda: TrendingDown,
  cliente: Users,
  conta: CreditCard,
};

const typeLabels = {
  entrada: "Entradas",
  venda: "Vendas",
  cliente: "Clientes",
  conta: "Contas",
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { entries, sales, clients, accounts, programs, origemTypes } = useData();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    entries.forEach((e) => {
      const account = accounts.find((a) => a.id === e.accountId);
      const origem = origemTypes.find((ot) => ot.id === e.origemTypeId)?.name ?? programs.find((p) => p.id === e.origemTypeId)?.name ?? "";
      const text = `${account?.name ?? ""} ${origem} ${new Date(e.date).toLocaleDateString("pt-BR")}`.toLowerCase();
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
      const text = `${s.clientName} ${s.ownerName} ${s.program} ${s.ticketLocator ?? ""}`.toLowerCase();
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
  }, [query, entries, sales, clients, accounts, programs, origemTypes]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => {
      const arr = map.get(r.type) ?? [];
      arr.push(r);
      map.set(r.type, arr);
    });
    return map;
  }, [results]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (url: string) => {
    navigate(url);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          className="pl-9 pr-16 w-48 sm:w-64 md:w-72"
          placeholder="Buscar…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 sm:hidden text-muted-foreground"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full min-w-[300px] max-h-80 overflow-y-auto rounded-xl border bg-background shadow-lg z-50">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhum resultado para "{query}"
            </div>
          ) : (
            <div className="py-2">
              {Array.from(grouped.entries()).map(([type, items]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons];
                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {typeLabels[type as keyof typeof typeLabels]}
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
                        onClick={() => handleSelect(item.url)}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
