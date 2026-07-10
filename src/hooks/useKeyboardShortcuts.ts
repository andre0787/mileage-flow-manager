import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutMap {
  [key: string]: () => void;
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
      // Ignorar se estiver em input, textarea ou select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

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
