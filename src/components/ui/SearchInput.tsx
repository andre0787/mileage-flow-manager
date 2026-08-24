/**
 * SearchInput — Input de busca consistente com ícone e suporte a hotkey.
 *
 * Uso:
 *   <SearchInput
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Buscar contas..."
 *   />
 *
 * Design system: UI-GUIDE.md
 * - Ícone de lupa à esquerda
 * - Botão de limpar quando há texto
 * - Indicador visual de Ctrl+K / ⌘K para busca global
 * - Transições suaves conforme guia
 */

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Se true, exibe indicador de hotkey (Ctrl+K) */
  showHotkey?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  autoFocus = false,
  showHotkey = true,
  className = "",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`relative flex items-center transition-colors ${className}`}
      data-search-input=""
    >
      <Search
        className={`absolute left-3 h-4 w-4 transition-colors ${
          focused ? "text-primary" : "text-muted-foreground"
        }`}
      />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // Dark: material translúcido (bg-secondary/60 + blur) — a causa raiz era
        // --secondary sem override no .dark; com a variável corrigida o /60
        // vira um vidro escuro discreto estilo iOS, quase transparente.
        className="pl-9 pr-8 h-9 text-sm transition-shadow focus-visible:shadow-elegant dark:bg-secondary/60 dark:backdrop-blur-sm"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Limpar busca"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {!value && showHotkey && !focused && (
        <kbd className="absolute right-2 hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-black/40 dark:border-border/60">
          <span className="text-xs">⌘</span>K
        </kbd>
      )}
    </div>
  );
}
