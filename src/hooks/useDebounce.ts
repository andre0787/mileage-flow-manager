import { useState, useEffect } from "react";

/**
 * Hook que retorna um valor defasado (debounced).
 * Útil para campos de busca que disparam filtros em listas grandes.
 * @param value Valor a ser debounced
 * @param delay Milissegundos de espera (default: 300)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
