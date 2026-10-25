import { TrendingUp, TrendingDown, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchResult } from "@/hooks/useGlobalSearch";

export const typeIcons = {
  entrada: TrendingUp,
  venda: TrendingDown,
  cliente: Users,
  conta: CreditCard,
};

export const typeLabels = {
  entrada: "Entradas",
  venda: "Vendas",
  cliente: "Clientes",
  conta: "Contas",
};

interface SearchResultItemProps {
  item: SearchResult;
  active: boolean;
  flatIdx: number;
  onHover: (index: number) => void;
  onSelect: (url: string) => void;
}

export function SearchResultItem({
  item,
  active,
  flatIdx,
  onHover,
  onSelect,
}: SearchResultItemProps) {
  const Icon = typeIcons[item.type];

  const setScrollRef = (el: HTMLButtonElement | null) => {
    if (!active) return;
    if (typeof el?.scrollIntoView !== "function") return;
    el.scrollIntoView({ block: "nearest" });
  };

  return (
    <button
      id={`gs-result-${item.id}`}
      role="option"
      aria-selected={active}
      ref={setScrollRef}
      className={cn(
        "w-full px-3 py-2 flex items-center gap-3 transition-colors text-left",
        active
          ? "bg-accent/60 text-accent-foreground"
          : "hover:bg-accent/40 dark:hover:bg-accent/50",
      )}
      onMouseEnter={() => onHover(flatIdx)}
      onClick={() => onSelect(item.url)}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
      </div>
    </button>
  );
}
