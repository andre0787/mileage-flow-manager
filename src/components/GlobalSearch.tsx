import { useState, useRef, useEffect, useMemo } from "react";
import { Search, SearchX, TrendingUp, TrendingDown, Users, CreditCard, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/DataContext";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { formatDateBR } from "@/lib/dateUtils";

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
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

  // Lista plana (na ordem exibida) para navegação por teclado
  const flatResults = useMemo(
    () => Array.from(grouped.entries()).flatMap(([, items]) => items),
    [grouped],
  );

  // Reset do cursor quando a query muda ou o dropdown fecha
  useEffect(() => {
    setActiveIndex(-1);
  }, [query, isOpen]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? flatResults.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(flatResults[activeIndex].url);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          className="pl-9 pr-16 w-32 sm:w-48 md:w-72 dark:bg-secondary/60 dark:backdrop-blur-sm"
          placeholder="Buscar…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls="global-search-results"
          aria-activedescendant={
            activeIndex >= 0 ? `gs-result-${flatResults[activeIndex]?.id}` : undefined
          }
          role="combobox"
          aria-autocomplete="list"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-black/40 dark:border-border/60">
          ⌘K
        </kbd>
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 sm:hidden text-muted-foreground"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-2rem))] max-h-80 overflow-y-auto rounded-xl border bg-background shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-150 dark:bg-card dark:border-border/70 dark:shadow-2xl"
        >
          {results.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center space-y-2">
              <SearchX className="h-6 w-6 mx-auto opacity-60" />
              <p>
                Nenhum resultado para <span className="font-medium text-foreground">"{query}"</span>
              </p>
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
                    {items.map((item) => {
                      const flatIdx = flatResults.indexOf(item);
                      const active = flatIdx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          id={`gs-result-${item.id}`}
                          role="option"
                          aria-selected={active}
                          ref={(el) => {
                            if (active && typeof el?.scrollIntoView === "function") {
                              el.scrollIntoView({ block: "nearest" });
                            }
                          }}
                          className={cn(
                            "w-full px-3 py-2 flex items-center gap-3 transition-colors text-left",
                            active
                              ? "bg-accent/60 text-accent-foreground"
                              : "hover:bg-accent/40 dark:hover:bg-accent/50",
                          )}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          onClick={() => handleSelect(item.url)}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              active ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
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
