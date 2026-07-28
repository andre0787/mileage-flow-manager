/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Habilita debug log via env antes de importar o módulo
vi.stubEnv("VITE_ENABLE_DEBUG_LOG", "true");

const { logError, logDestructiveOp } = await import("@/lib/logger");

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("logger", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  describe("logError", () => {
    it("deve persistir log de erro no localStorage", () => {
      logError("test.context", new Error("algo deu errado"));

      const logs = JSON.parse(localStorageMock.getItem("mc_debug_logs") || "[]");
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("error");
      expect(logs[0].context).toBe("test.context");
      expect(logs[0].error).toBe("algo deu errado");
    });

    it("deve aceitar string como error", () => {
      logError("string.error", "mensagem de erro");

      const logs = JSON.parse(localStorageMock.getItem("mc_debug_logs") || "[]");
      expect(logs).toHaveLength(1);
      expect(logs[0].error).toBe("mensagem de erro");
    });

    it("deve incluir timestamp", () => {
      const before = Date.now();
      logError("timestamp.test", "erro");
      const after = Date.now();

      const logs = JSON.parse(localStorageMock.getItem("mc_debug_logs") || "[]");
      const ts = new Date(logs[0].timestamp).getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  describe("logDestructiveOp", () => {
    it("deve persistir operação destrutiva", () => {
      logDestructiveOp("delete", "excluir.registro", { id: "123" });

      const logs = JSON.parse(localStorageMock.getItem("mc_debug_logs") || "[]");
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("destructive_op");
      expect(logs[0].context).toBe("delete: excluir.registro");
      expect(logs[0].details).toEqual({ id: "123" });
    });

    it("deve aceitar operação clear", () => {
      logDestructiveOp("clear", "limpar.cache");

      const logs = JSON.parse(localStorageMock.getItem("mc_debug_logs") || "[]");
      expect(logs[0].context).toBe("clear: limpar.cache");
    });

    it("deve aceitar operação cancel", () => {
      logDestructiveOp("cancel", "cancelar.venda", { vendaId: "456" });

      const logs = JSON.parse(localStorageMock.getItem("mc_debug_logs") || "[]");
      expect(logs[0].context).toBe("cancel: cancelar.venda");
      expect(logs[0].details?.vendaId).toBe("456");
    });
  });

  describe("limite de logs", () => {
    it("deve manter no máximo 100 logs", () => {
      for (let i = 0; i < 150; i++) {
        logError(`bulk.${i}`, `erro ${i}`);
      }

      const logs = JSON.parse(localStorageMock.getItem("mc_debug_logs") || "[]");
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });
});
