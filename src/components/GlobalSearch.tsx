import { useState, useRef, useEffect } from "react";
import { Search, SearchX, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { SearchResultItem, typeLabels } from "@/components/SearchResultItem";

export function GlobalSearch() {
  const { query, setQuery, results, grouped, flatResults } = useGlobalSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
              {Array.from(grouped.entries()).map(([type, items]) => (
                <div key={type}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {typeLabels[type as keyof typeof typeLabels]}
                  </div>
                  {items.map((item) => {
                    const flatIdx = flatResults.indexOf(item);
                    const active = flatIdx === activeIndex;
                    return (
                      <SearchResultItem
                        key={item.id}
                        item={item}
                        active={active}
                        flatIdx={flatIdx}
                        onHover={setActiveIndex}
                        onSelect={handleSelect}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
