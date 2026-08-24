import { useEffect } from "react";
import { useNavigate } from "react-router";

interface ShortcutMap {
  [key: string]: () => void;
}

export function shouldIgnoreShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  if (target.isContentEditable || target.closest("[contenteditable]")) return true;
  if (document.querySelector("[role='dialog'][data-state='open']")) return true;
  if (target.closest("[role='dialog']")) return true;
  if (target.closest("[aria-haspopup], [data-radix-collection-item]")) return true;
  return false;
}

/**
 * Hook para atalhos de teclado globais.
 * Atalhos:
 * - g → Dashboard (Home)
 * - e → Entradas
 * - v → Vendas
 * - c → Clientes
 * - p → Perfil
 * - s → Configurações (Settings)
 * - r → Relatórios
 * - ? → Mostrar ajuda (future)
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const shortcuts: ShortcutMap = {
      g: () => navigate("/"),
      e: () => navigate("/entradas"),
      v: () => navigate("/vendas"),
      c: () => navigate("/clientes"),
      p: () => navigate("/perfil"),
      s: () => navigate("/configuracoes"),
      r: () => navigate("/relatorios"),
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcutTarget(e.target)) return;

      // Ignorar se Ctrl/Alt/Meta estiver pressionado
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const key = e.key.toLowerCase();
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
